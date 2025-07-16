import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/api';
import { logError } from '../../utils/logger';
import './AdminWeatherMonitor.css';

const AdminWeatherMonitor = () => {
  const { t } = useTranslation();
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
        <h2>{t('adminWeatherMonitor.accessDeniedTitle')}</h2>
        <p>{t('adminWeatherMonitor.accessDeniedMessage')}</p>
      </div>
    );
  }

  if (loading) {
    return <div className="admin-weather-loading">{t('adminWeatherMonitor.loadingMessage')}</div>;
  }

  if (error) {
    return <div className="admin-weather-error">{error}</div>;
  }

  return (
    <div className="admin-weather-monitor">
      <div className="admin-weather-header">
        <h1>{t('adminWeatherMonitor.title')}</h1>
        <p>{t('adminWeatherMonitor.subtitle')}</p>
        <div className="last-updated">
          {t('adminWeatherMonitor.lastUpdated', {
            time: lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never',
          })}
          <button onClick={fetchWeatherStats} className="refresh-btn">
            {t('adminWeatherMonitor.refreshButton')}
          </button>
        </div>
      </div>

      {/* API Statistics */}
      {weatherStats?.apiStats && (
        <div className="weather-section">
          <h2>{t('adminWeatherMonitor.apiStatistics.title')}</h2>
          <div className="api-stats-grid">
            <div className="stat-card">
              <h3>{t('adminWeatherMonitor.apiStatistics.totalRequests')}</h3>
              <div className="stat-value">{formatNumber(weatherStats.apiStats.totalRequests)}</div>
            </div>
            <div className="stat-card">
              <h3>{t('adminWeatherMonitor.apiStatistics.successfulRequests')}</h3>
              <div className="stat-value success">
                {formatNumber(weatherStats.apiStats.successfulRequests)}
              </div>
            </div>
            <div className="stat-card">
              <h3>{t('adminWeatherMonitor.apiStatistics.failedRequests')}</h3>
              <div className="stat-value error">
                {formatNumber(weatherStats.apiStats.failedRequests)}
              </div>
            </div>
            <div className={`stat-card ${getApiStatusColor(weatherStats.apiStats)}`}>
              <h3>{t('adminWeatherMonitor.apiStatistics.errorRate')}</h3>
              <div className="stat-value">
                {weatherStats.apiStats.errorRate
                  ? `${weatherStats.apiStats.errorRate.toFixed(2)}%`
                  : 'N/A'}
              </div>
            </div>
            <div className="stat-card">
              <h3>{t('adminWeatherMonitor.apiStatistics.averageResponseTime')}</h3>
              <div className="stat-value">
                {weatherStats.apiStats.avgResponseTime
                  ? `${weatherStats.apiStats.avgResponseTime.toFixed(2)}ms`
                  : 'N/A'}
              </div>
            </div>
            <div className="stat-card">
              <h3>{t('adminWeatherMonitor.apiStatistics.lastRequest')}</h3>
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
          <h2>{t('adminWeatherMonitor.recentRequests.title')}</h2>
          <div className="recent-requests-list">
            {weatherStats.recentRequests.map((req, idx) => (
              <div key={idx} className="recent-request-item">
                <div>
                  <strong>{t('adminWeatherMonitor.recentRequests.latitude')}</strong> {req.lat},{' '}
                  <strong>{t('adminWeatherMonitor.recentRequests.longitude')}</strong> {req.lng}
                </div>
                <div>
                  <strong>{t('adminWeatherMonitor.recentRequests.source')}</strong>{' '}
                  {req.source || 'api'}
                </div>
                <div>
                  <strong>{t('adminWeatherMonitor.recentRequests.responseTime')}</strong>{' '}
                  {req.responseTime ? `${req.responseTime}ms` : 'N/A'}
                </div>
                <div>
                  <strong>{t('adminWeatherMonitor.recentRequests.timestamp')}</strong>{' '}
                  {req.timestamp ? new Date(req.timestamp).toLocaleString() : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Health */}
      <div className="weather-section">
        <h2>{t('adminWeatherMonitor.systemHealth.title')}</h2>
        <div className="health-indicators">
          <div className={`health-indicator ${getApiStatusColor(weatherStats?.apiStats)}`}>
            <span className="indicator-label">
              {t('adminWeatherMonitor.systemHealth.apiPerformance')}
            </span>
            <span className="indicator-status">
              {weatherStats?.apiStats?.errorRate < 5
                ? t('adminWeatherMonitor.systemHealth.status.good')
                : weatherStats?.apiStats?.errorRate < 15
                  ? t('adminWeatherMonitor.systemHealth.status.warning')
                  : t('adminWeatherMonitor.systemHealth.status.poor')}
            </span>
          </div>
        </div>
      </div>

      {/* No Data Message */}
      {!weatherStats?.apiStats && (
        <div className="weather-section">
          <div className="no-data-message">
            <h3>{t('adminWeatherMonitor.noData.title')}</h3>
            <p>{t('adminWeatherMonitor.noData.message')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWeatherMonitor;
