import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    return t(`adminAnalytics.periodSelector.${period}`, t('adminAnalytics.periodSelector.30d'));
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="admin-analytics-unauthorized">
        <h2>{t('adminAnalytics.accessDeniedTitle')}</h2>
        <p>{t('adminAnalytics.accessDeniedMessage')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-analytics-loading">
        <div className="loading-spinner"></div>
        <p>{t('adminAnalytics.loadingMessage')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-analytics-error">
        <h2>{t('adminAnalytics.errorTitle')}</h2>
        <p>{error}</p>
        <button onClick={fetchAnalyticsData} className="retry-button">
          {t('adminAnalytics.retryButton')}
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
            <h1>{t('adminAnalytics.title')}</h1>
            <p className="header-subtitle">
              {t('adminAnalytics.subtitle', { period: getPeriodLabel(selectedPeriod) })}
            </p>
          </div>
          <div className="header-controls">
            <select
              value={selectedPeriod}
              onChange={handlePeriodChange}
              className="period-selector"
            >
              <option value="7d">{t('adminAnalytics.periodSelector.7d')}</option>
              <option value="30d">{t('adminAnalytics.periodSelector.30d')}</option>
              <option value="90d">{t('adminAnalytics.periodSelector.90d')}</option>
              <option value="1y">{t('adminAnalytics.periodSelector.1y')}</option>
            </select>
            <button onClick={fetchAnalyticsData} className="refresh-button">
              {t('adminAnalytics.refreshButton')}
            </button>
          </div>
        </div>
        <div className="last-updated">
          {t('adminAnalytics.lastUpdated', { time: lastRefreshed.toLocaleTimeString() })}
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="analytics-section">
        <div className="section-header">
          <h2>{t('adminAnalytics.platformPerformance.title')}</h2>
          <p className="section-subtitle">{t('adminAnalytics.platformPerformance.subtitle')}</p>
        </div>
        <div className="kpi-grid">
          <div className="kpi-card revenue">
            <div className="kpi-icon">💰</div>
            <div className="kpi-content">
              <div className="kpi-value">{formatCurrency(revenue?.total)}</div>
              <div className="kpi-label">
                {t('adminAnalytics.platformPerformance.revenue.label')}
              </div>
              <div className="kpi-change">
                <span className={revenue?.change >= 0 ? 'positive' : 'negative'}>
                  {revenue?.change >= 0 ? '↗' : '↘'} {formatPercentage(Math.abs(revenue?.change))}
                </span>
                <span className="change-label">
                  {t('adminAnalytics.platformPerformance.revenue.changeLabel')}
                </span>
              </div>
            </div>
          </div>

          <div className="kpi-card bookings">
            <div className="kpi-icon">📅</div>
            <div className="kpi-content">
              <div className="kpi-value">{formatNumber(bookings?.total)}</div>
              <div className="kpi-label">
                {t('adminAnalytics.platformPerformance.bookings.label')}
              </div>
              <div className="kpi-change">
                <span className={bookings?.change >= 0 ? 'positive' : 'negative'}>
                  {bookings?.change >= 0 ? '↗' : '↘'}{' '}
                  {formatPercentage(Math.abs(bookings?.change))}
                </span>
                <span className="change-label">
                  {t('adminAnalytics.platformPerformance.bookings.changeLabel')}
                </span>
              </div>
            </div>
          </div>

          <div className="kpi-card users">
            <div className="kpi-icon">👥</div>
            <div className="kpi-content">
              <div className="kpi-value">{formatNumber(users?.total)}</div>
              <div className="kpi-label">{t('adminAnalytics.platformPerformance.users.label')}</div>
              <div className="kpi-change">
                <span className={users?.growth >= 0 ? 'positive' : 'negative'}>
                  {users?.growth >= 0 ? '↗' : '↘'} {formatPercentage(Math.abs(users?.growth))}
                </span>
                <span className="change-label">
                  {t('adminAnalytics.platformPerformance.users.changeLabel')}
                </span>
              </div>
            </div>
          </div>

          <div className="kpi-card owners">
            <div className="kpi-icon">🏢</div>
            <div className="kpi-content">
              <div className="kpi-value">{formatNumber(owners?.total)}</div>
              <div className="kpi-label">
                {t('adminAnalytics.platformPerformance.owners.label')}
              </div>
              <div className="kpi-change">
                <span className={owners?.growth >= 0 ? 'positive' : 'negative'}>
                  {owners?.growth >= 0 ? '↗' : '↘'} {formatPercentage(Math.abs(owners?.growth))}
                </span>
                <span className="change-label">
                  {t('adminAnalytics.platformPerformance.owners.changeLabel')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Analysis */}
      <div className="analytics-section">
        <div className="section-header">
          <h2>{t('adminAnalytics.revenueAnalysis.title')}</h2>
          <p className="section-subtitle">{t('adminAnalytics.revenueAnalysis.subtitle')}</p>
        </div>
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="card-header">
              <h3>{t('adminAnalytics.revenueAnalysis.trends.title')}</h3>
              <p className="card-subtitle">{t('adminAnalytics.revenueAnalysis.trends.subtitle')}</p>
            </div>
            <div className="card-content">
              <div className="revenue-chart">
                {revenue?.monthlyTrend?.map((month, index) => (
                  <div key={index} className="chart-bar">
                    <div className="bar-tooltip">
                      <div className="tooltip-month">{month.month}</div>
                      <div className="tooltip-revenue">{formatCurrency(month.revenue)}</div>
                      <div className="tooltip-bookings">
                        {month.bookings}{' '}
                        {t('adminAnalytics.revenueAnalysis.trends.tooltip.bookings')}
                      </div>
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
              <h3>{t('adminAnalytics.revenueAnalysis.metrics.title')}</h3>
              <p className="card-subtitle">
                {t('adminAnalytics.revenueAnalysis.metrics.subtitle')}
              </p>
            </div>
            <div className="card-content">
              <div className="metrics-list">
                <div className="metric-item">
                  <span className="metric-label">
                    {t('adminAnalytics.revenueAnalysis.metrics.averageBookingValue.label')}
                  </span>
                  <span className="metric-value">
                    {formatCurrency(revenue?.averageBookingValue)}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">
                    {t('adminAnalytics.revenueAnalysis.metrics.activeUsers.label')}
                  </span>
                  <span className="metric-value">{formatNumber(bookings?.activeUsers)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">
                    {t('adminAnalytics.revenueAnalysis.metrics.revenueGrowth.label')}
                  </span>
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
          <h2>{t('adminAnalytics.userOwnerAnalytics.title')}</h2>
          <p className="section-subtitle">{t('adminAnalytics.userOwnerAnalytics.subtitle')}</p>
        </div>
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="card-header">
              <h3>{t('adminAnalytics.userOwnerAnalytics.userGrowth.title')}</h3>
              <p className="card-subtitle">
                {t('adminAnalytics.userOwnerAnalytics.userGrowth.subtitle')}
              </p>
            </div>
            <div className="card-content">
              <div className="user-stats">
                <div className="stat-item">
                  <div className="stat-value">{formatNumber(users?.newUsers)}</div>
                  <div className="stat-label">
                    {t('adminAnalytics.userOwnerAnalytics.userGrowth.newUsers.label')}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{formatNumber(users?.activeUsers)}</div>
                  <div className="stat-label">
                    {t('adminAnalytics.userOwnerAnalytics.userGrowth.activeUsers.label')}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{formatPercentage(users?.growth)}</div>
                  <div className="stat-label">
                    {t('adminAnalytics.userOwnerAnalytics.userGrowth.growthRate.label')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-header">
              <h3>{t('adminAnalytics.userOwnerAnalytics.ownerApplications.title')}</h3>
              <p className="card-subtitle">
                {t('adminAnalytics.userOwnerAnalytics.ownerApplications.subtitle')}
              </p>
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
          <h2>{t('adminAnalytics.campgroundPerformance.title')}</h2>
          <p className="section-subtitle">{t('adminAnalytics.campgroundPerformance.subtitle')}</p>
        </div>
        <div className="campgrounds-list">
          {campgrounds?.topPerformers?.map((campground, index) => (
            <div key={campground.campgroundId} className="campground-item">
              <div className="campground-rank">#{index + 1}</div>
              <div className="campground-info">
                <div className="campground-name">{campground.campgroundName}</div>
                <div className="campground-location">{campground.location}</div>
                <div className="campground-stats">
                  <span className="stat">
                    {formatCurrency(campground.revenue)}{' '}
                    {t('adminAnalytics.campgroundPerformance.revenue')}
                  </span>
                  <span className="separator">•</span>
                  <span className="stat">
                    {campground.bookings} {t('adminAnalytics.campgroundPerformance.bookings')}
                  </span>
                  <span className="separator">•</span>
                  <span className="stat">⭐ {campground.averageRating?.toFixed(1) || 'N/A'}</span>
                  <span className="separator">•</span>
                  <span className="stat">
                    {campground.reviewCount} {t('adminAnalytics.campgroundPerformance.reviews')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Health */}
      <div className="analytics-section">
        <div className="section-header">
          <h2>{t('adminAnalytics.platformHealth.title')}</h2>
          <p className="section-subtitle">{t('adminAnalytics.platformHealth.subtitle')}</p>
        </div>
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="card-header">
              <h3>{t('adminAnalytics.platformHealth.safetySecurity.title')}</h3>
              <p className="card-subtitle">
                {t('adminAnalytics.platformHealth.safetySecurity.subtitle')}
              </p>
            </div>
            <div className="card-content">
              <div className="health-stats">
                <div className="health-item">
                  <div className="health-value">{platform?.safetyAlerts?.total}</div>
                  <div className="health-label">
                    {t('adminAnalytics.platformHealth.safetyAlerts.total.label')}
                  </div>
                </div>
                <div className="health-item active">
                  <div className="health-value">{platform?.safetyAlerts?.active}</div>
                  <div className="health-label">
                    {t('adminAnalytics.platformHealth.safetyAlerts.active.label')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-header">
              <h3>{t('adminAnalytics.platformHealth.userEngagement.title')}</h3>
              <p className="card-subtitle">
                {t('adminAnalytics.platformHealth.userEngagement.subtitle')}
              </p>
            </div>
            <div className="card-content">
              <div className="health-stats">
                <div className="health-item">
                  <div className="health-value">{platform?.trips?.total}</div>
                  <div className="health-label">
                    {t('adminAnalytics.platformHealth.trips.total.label')}
                  </div>
                </div>
                <div className="health-item public">
                  <div className="health-value">{platform?.trips?.public}</div>
                  <div className="health-label">
                    {t('adminAnalytics.platformHealth.trips.public.label')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews & Ratings */}
      <div className="analytics-section">
        <div className="section-header">
          <h2>{t('adminAnalytics.reviewsRatings.title')}</h2>
          <p className="section-subtitle">{t('adminAnalytics.reviewsRatings.subtitle')}</p>
        </div>
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="card-header">
              <h3>{t('adminAnalytics.reviewsRatings.overallRating.title')}</h3>
              <p className="card-subtitle">
                {t('adminAnalytics.reviewsRatings.overallRating.subtitle')}
              </p>
            </div>
            <div className="card-content">
              <div className="rating-overview">
                <div className="rating-score">{(reviews?.averageRating || 0).toFixed(1)}</div>
                <div className="rating-stars">⭐⭐⭐⭐⭐</div>
                <div className="rating-count">
                  {formatNumber(reviews?.totalReviews)}{' '}
                  {t('adminAnalytics.reviewsRatings.totalReviews')}
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-header">
              <h3>{t('adminAnalytics.reviewsRatings.ratingDistribution.title')}</h3>
              <p className="card-subtitle">
                {t('adminAnalytics.reviewsRatings.ratingDistribution.subtitle')}
              </p>
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
