import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/api';
import { logError } from '../../utils/logger';
import './AdminWeatherMonitor.css';

const AdminWeatherMonitor = () => {
  const { currentUser } = useAuth();
  const [weatherStats, setWeatherStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchWeatherStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/admin/weather/stats');
      const data = response.data.data || response.data;

      setWeatherStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      logError('Error fetching weather stats', err);
      const errorMessage = err.response?.data?.message || 'Failed to load weather statistics';
      setError(errorMessage);

      // If it's an authentication error, stop auto-refresh
      if (err.response?.status === 401 || err.response?.status === 403) {
        return false; // Signal to stop auto-refresh
      }
    } finally {
      setLoading(false);
    }
    return true; // Signal to continue auto-refresh
  };

  useEffect(() => {
    fetchWeatherStats();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const shouldContinue = await fetchWeatherStats();
      if (!shouldContinue) {
        clearInterval(interval);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString();
  };

  const getApiStatusColor = (stats) => {
    if (!stats) return 'unknown';
    const errorRate = stats.errorRate || 0;
    if (errorRate < 5) return 'good';
    if (errorRate < 15) return 'warning';
    return 'error';
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="admin-weather-unauthorized">
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="admin-weather-loading">Loading weather statistics...</div>;
  }

  if (error) {
    return <div className="admin-weather-error">{error}</div>;
  }

  return (
    <div className="admin-weather-monitor">
      <div className="admin-weather-header">
        <h1>Weather System Monitor</h1>
        <p>Monitor weather API performance and recent requests</p>
        <div className="last-updated">
          Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
          <button onClick={fetchWeatherStats} className="refresh-btn">
            Refresh
          </button>
        </div>
      </div>

      {/* API Statistics */}
      {weatherStats?.apiStats && (
        <div className="weather-section">
          <h2>API Statistics</h2>
          <div className="api-stats-grid">
            <div className="stat-card">
              <h3>Total Requests</h3>
              <div className="stat-value">{formatNumber(weatherStats.apiStats.totalRequests)}</div>
            </div>
            <div className="stat-card">
              <h3>Successful Requests</h3>
              <div className="stat-value success">
                {formatNumber(weatherStats.apiStats.successfulRequests)}
              </div>
            </div>
            <div className="stat-card">
              <h3>Failed Requests</h3>
              <div className="stat-value error">
                {formatNumber(weatherStats.apiStats.failedRequests)}
              </div>
            </div>
            <div className={`stat-card ${getApiStatusColor(weatherStats.apiStats)}`}>
              <h3>Error Rate</h3>
              <div className="stat-value">
                {weatherStats.apiStats.errorRate
                  ? `${weatherStats.apiStats.errorRate.toFixed(2)}%`
                  : 'N/A'}
              </div>
            </div>
            <div className="stat-card">
              <h3>Average Response Time</h3>
              <div className="stat-value">
                {weatherStats.apiStats.avgResponseTime
                  ? `${weatherStats.apiStats.avgResponseTime.toFixed(2)}ms`
                  : 'N/A'}
              </div>
            </div>
            <div className="stat-card">
              <h3>Last Request</h3>
              <div className="stat-value">
                {weatherStats.apiStats.lastRequest
                  ? new Date(weatherStats.apiStats.lastRequest).toLocaleString()
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Requests */}
      {weatherStats?.recentRequests && weatherStats.recentRequests.length > 0 && (
        <div className="weather-section">
          <h2>Recent Weather Requests</h2>
          <div className="recent-requests-list">
            {weatherStats.recentRequests.map((req, idx) => (
              <div key={idx} className="recent-request-item">
                <div>
                  <strong>Lat:</strong> {req.lat}, <strong>Lng:</strong> {req.lng}
                </div>
                <div>
                  <strong>Source:</strong> {req.source || 'api'}
                </div>
                <div>
                  <strong>Response Time:</strong>{' '}
                  {req.responseTime ? `${req.responseTime}ms` : 'N/A'}
                </div>
                <div>
                  <strong>Timestamp:</strong>{' '}
                  {req.timestamp ? new Date(req.timestamp).toLocaleString() : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Health */}
      <div className="weather-section">
        <h2>System Health</h2>
        <div className="health-indicators">
          <div className={`health-indicator ${getApiStatusColor(weatherStats?.apiStats)}`}>
            <span className="indicator-label">API Performance</span>
            <span className="indicator-status">
              {weatherStats?.apiStats?.errorRate < 5
                ? '✅ Good'
                : weatherStats?.apiStats?.errorRate < 15
                  ? '⚠️ Warning'
                  : '❌ Poor'}
            </span>
          </div>
        </div>
      </div>

      {/* No Data Message */}
      {!weatherStats?.apiStats && (
        <div className="weather-section">
          <div className="no-data-message">
            <h3>No Weather Statistics Available</h3>
            <p>
              The weather system may not be actively collecting statistics or the Redis cache may be
              unavailable.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWeatherMonitor;
