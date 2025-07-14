import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../utils/api';
import { logError } from '../utils/logger';
import './AdminAnalyticsPage.css';

/**
 * Admin Analytics Page
 * Comprehensive business analytics dashboard for platform administrators
 */
const AdminAnalyticsPage = () => {
  const { currentUser } = useAuth();
  const { showMessage } = useFlashMessage();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/admin/analytics/business', {
        params: { period: selectedPeriod },
      });

      const data = response.data.data || response.data;
      setAnalyticsData(data);
      setLastRefreshed(new Date());
    } catch (err) {
      logError('Error fetching admin analytics', err);
      const errorMessage = err.response?.data?.message || 'Failed to load analytics data';
      setError(errorMessage);
      showMessage('Error loading analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.isAdmin) {
      fetchAnalyticsData();
    }
  }, [selectedPeriod, currentUser]);

  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value || 0);
  };

  const getPeriodLabel = (period) => {
    const labels = {
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days',
      '1y': 'Last Year',
    };
    return labels[period] || 'Custom Period';
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="admin-analytics-unauthorized">
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading platform analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-analytics-error">
        <h2>Error Loading Analytics</h2>
        <p>{error}</p>
        <button onClick={fetchAnalyticsData} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  const { overview, revenue, bookings, users, owners, campgrounds, reviews, platform } =
    analyticsData || {};

  return (
    <div className="admin-analytics">
      {/* Page Header */}
      <div className="analytics-header">
        <div className="header-content">
          <div className="header-main">
            <h1>Platform Analytics</h1>
            <p className="header-subtitle">
              Comprehensive business intelligence for {getPeriodLabel(selectedPeriod)}
            </p>
          </div>
          <div className="header-controls">
            <select
              value={selectedPeriod}
              onChange={handlePeriodChange}
              className="period-selector"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            <button onClick={fetchAnalyticsData} className="refresh-button">
              🔄 Refresh
            </button>
          </div>
        </div>
        <div className="last-updated">Last updated: {lastRefreshed.toLocaleTimeString()}</div>
      </div>

      {/* Key Performance Indicators */}
      <div className="analytics-section">
        <div className="section-header">
          <h2>Platform Performance</h2>
          <p className="section-subtitle">Key metrics and growth indicators</p>
        </div>
        <div className="kpi-grid">
          <div className="kpi-card revenue">
            <div className="kpi-icon">💰</div>
            <div className="kpi-content">
              <div className="kpi-value">{formatCurrency(revenue?.total)}</div>
              <div className="kpi-label">Platform Revenue</div>
              <div className="kpi-change">
                <span className={revenue?.change >= 0 ? 'positive' : 'negative'}>
                  {revenue?.change >= 0 ? '↗' : '↘'} {formatPercentage(Math.abs(revenue?.change))}
                </span>
                <span className="change-label">vs previous period</span>
              </div>
            </div>
          </div>

          <div className="kpi-card bookings">
            <div className="kpi-icon">📅</div>
            <div className="kpi-content">
              <div className="kpi-value">{formatNumber(bookings?.total)}</div>
              <div className="kpi-label">Total Bookings</div>
              <div className="kpi-change">
                <span className={bookings?.change >= 0 ? 'positive' : 'negative'}>
                  {bookings?.change >= 0 ? '↗' : '↘'}{' '}
                  {formatPercentage(Math.abs(bookings?.change))}
                </span>
                <span className="change-label">vs previous period</span>
              </div>
            </div>
          </div>

          <div className="kpi-card users">
            <div className="kpi-icon">👥</div>
            <div className="kpi-content">
              <div className="kpi-value">{formatNumber(users?.total)}</div>
              <div className="kpi-label">Total Users</div>
              <div className="kpi-change">
                <span className={users?.growth >= 0 ? 'positive' : 'negative'}>
                  {users?.growth >= 0 ? '↗' : '↘'} {formatPercentage(Math.abs(users?.growth))}
                </span>
                <span className="change-label">growth rate</span>
              </div>
            </div>
          </div>

          <div className="kpi-card owners">
            <div className="kpi-icon">🏢</div>
            <div className="kpi-content">
              <div className="kpi-value">{formatNumber(owners?.total)}</div>
              <div className="kpi-label">Total Owners</div>
              <div className="kpi-change">
                <span className={owners?.growth >= 0 ? 'positive' : 'negative'}>
                  {owners?.growth >= 0 ? '↗' : '↘'} {formatPercentage(Math.abs(owners?.growth))}
                </span>
                <span className="change-label">growth rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Analysis */}
      <div className="analytics-section">
        <div className="section-header">
          <h2>Revenue Analysis</h2>
          <p className="section-subtitle">Platform revenue trends and performance</p>
        </div>
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="card-header">
              <h3>Revenue Trends</h3>
              <p className="card-subtitle">Monthly revenue over the last 12 months</p>
            </div>
            <div className="card-content">
              <div className="revenue-chart">
                {revenue?.monthlyTrend?.map((month, index) => (
                  <div key={index} className="chart-bar">
                    <div className="bar-tooltip">
                      <div className="tooltip-month">{month.month}</div>
                      <div className="tooltip-revenue">{formatCurrency(month.revenue)}</div>
                      <div className="tooltip-bookings">{month.bookings} bookings</div>
                    </div>
                    <div
                      className="bar-fill"
                      style={{
                        height: `${(month.revenue / Math.max(...revenue.monthlyTrend.map((m) => m.revenue))) * 100}%`,
                      }}
                    ></div>
                    <span className="bar-label">{month.month.split('-')[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-header">
              <h3>Revenue Metrics</h3>
              <p className="card-subtitle">Key revenue performance indicators</p>
            </div>
            <div className="card-content">
              <div className="metrics-list">
                <div className="metric-item">
                  <span className="metric-label">Average Booking Value</span>
                  <span className="metric-value">
                    {formatCurrency(revenue?.averageBookingValue)}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Active Users</span>
                  <span className="metric-value">{formatNumber(bookings?.activeUsers)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Revenue Growth</span>
                  <span
                    className={`metric-value ${revenue?.change >= 0 ? 'positive' : 'negative'}`}
                  >
                    {formatPercentage(revenue?.change)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User & Owner Analytics */}
      <div className="analytics-section">
        <div className="section-header">
          <h2>User & Owner Analytics</h2>
          <p className="section-subtitle">Platform growth and engagement metrics</p>
        </div>
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="card-header">
              <h3>User Growth</h3>
              <p className="card-subtitle">New user registrations and activity</p>
            </div>
            <div className="card-content">
              <div className="user-stats">
                <div className="stat-item">
                  <div className="stat-value">{formatNumber(users?.newUsers)}</div>
                  <div className="stat-label">New Users</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{formatNumber(users?.activeUsers)}</div>
                  <div className="stat-label">Active Users</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{formatPercentage(users?.growth)}</div>
                  <div className="stat-label">Growth Rate</div>
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-header">
              <h3>Owner Applications</h3>
              <p className="card-subtitle">Owner application processing status</p>
            </div>
            <div className="card-content">
              <div className="application-stats">
                {Object.entries(owners?.applications || {}).map(([status, count]) => (
                  <div key={status} className={`application-item ${status}`}>
                    <div className="application-count">{count}</div>
                    <div className="application-status">{status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campground Performance */}
      <div className="analytics-section">
        <div className="section-header">
          <h2>Top Performing Campgrounds</h2>
          <p className="section-subtitle">Best performing campgrounds by revenue</p>
        </div>
        <div className="campgrounds-list">
          {campgrounds?.topPerformers?.map((campground, index) => (
            <div key={campground.campgroundId} className="campground-item">
              <div className="campground-rank">#{index + 1}</div>
              <div className="campground-info">
                <div className="campground-name">{campground.campgroundName}</div>
                <div className="campground-location">{campground.location}</div>
                <div className="campground-stats">
                  <span className="stat">{formatCurrency(campground.revenue)} revenue</span>
                  <span className="separator">•</span>
                  <span className="stat">{campground.bookings} bookings</span>
                  <span className="separator">•</span>
                  <span className="stat">⭐ {campground.averageRating?.toFixed(1) || 'N/A'}</span>
                  <span className="separator">•</span>
                  <span className="stat">{campground.reviewCount} reviews</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Health */}
      <div className="analytics-section">
        <div className="section-header">
          <h2>Platform Health</h2>
          <p className="section-subtitle">System status and feature usage</p>
        </div>
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="card-header">
              <h3>Safety & Security</h3>
              <p className="card-subtitle">Safety alerts and platform security</p>
            </div>
            <div className="card-content">
              <div className="health-stats">
                <div className="health-item">
                  <div className="health-value">{platform?.safetyAlerts?.total}</div>
                  <div className="health-label">Total Safety Alerts</div>
                </div>
                <div className="health-item active">
                  <div className="health-value">{platform?.safetyAlerts?.active}</div>
                  <div className="health-label">Active Alerts</div>
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-header">
              <h3>User Engagement</h3>
              <p className="card-subtitle">Trip planning and community features</p>
            </div>
            <div className="card-content">
              <div className="health-stats">
                <div className="health-item">
                  <div className="health-value">{platform?.trips?.total}</div>
                  <div className="health-label">Total Trips</div>
                </div>
                <div className="health-item public">
                  <div className="health-value">{platform?.trips?.public}</div>
                  <div className="health-label">Public Trips</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews & Ratings */}
      <div className="analytics-section">
        <div className="section-header">
          <h2>Reviews & Ratings</h2>
          <p className="section-subtitle">Platform-wide review performance</p>
        </div>
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="card-header">
              <h3>Overall Rating</h3>
              <p className="card-subtitle">Platform average rating and review count</p>
            </div>
            <div className="card-content">
              <div className="rating-overview">
                <div className="rating-score">{(reviews?.averageRating || 0).toFixed(1)}</div>
                <div className="rating-stars">⭐⭐⭐⭐⭐</div>
                <div className="rating-count">{formatNumber(reviews?.totalReviews)} reviews</div>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-header">
              <h3>Rating Distribution</h3>
              <p className="card-subtitle">Breakdown of ratings by star level</p>
            </div>
            <div className="card-content">
              <div className="rating-distribution">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviews?.ratingDistribution?.[stars] || 0;
                  const percentage =
                    reviews?.totalReviews > 0 ? (count / reviews.totalReviews) * 100 : 0;
                  return (
                    <div key={stars} className="rating-bar">
                      <span className="stars">{'⭐'.repeat(stars)}</span>
                      <div className="bar-container">
                        <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
