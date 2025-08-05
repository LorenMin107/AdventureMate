import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFlashMessage } from '../context/FlashMessageContext';
import { useTheme } from '../context/ThemeContext';
import useOwners from '../hooks/useOwners';
import './OwnerAnalyticsPage.css';

/**
 * Owner Analytics Page
 * Modern analytics dashboard for campground owners
 */
const OwnerAnalyticsPage = () => {
  const { t } = useTranslation();
  const { showMessage } = useFlashMessage();
  const { theme } = useTheme();
  const {
    useOwnerAnalytics,
    exportRevenueReport,
    exportBookingReport,
    exportReviewsReport,
    exportFullReport,
  } = useOwners();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedCampground, setSelectedCampground] = useState('all');

  // Fetch owner's analytics data
  const {
    data: analyticsData,
    isLoading,
    error: fetchError,
    refetch,
  } = useOwnerAnalytics({
    period: selectedPeriod,
    campground: selectedCampground !== 'all' ? selectedCampground : undefined,
  });

  useEffect(() => {
    if (analyticsData) {
      setLoading(false);
      setError(null);
    }
  }, [analyticsData]);

  useEffect(() => {
    if (fetchError) {
      setError(t('ownerAnalytics.errorTitle'));
      setLoading(false);
    }
  }, [fetchError, t]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
  };

  const handleCampgroundChange = (e) => {
    setSelectedCampground(e.target.value);
  };

  const handleExportRevenue = async () => {
    try {
      await exportRevenueReport(selectedPeriod);
      showMessage(t('ownerAnalytics.exportReports.revenueExported'), 'success');
    } catch (error) {
      showMessage(t('ownerAnalytics.exportReports.exportError'), 'error');
    }
  };

  const handleExportBookings = async () => {
    try {
      await exportBookingReport(selectedPeriod);
      showMessage(t('ownerAnalytics.exportReports.bookingsExported'), 'success');
    } catch (error) {
      showMessage(t('ownerAnalytics.exportReports.exportError'), 'error');
    }
  };

  const handleExportReviews = async () => {
    try {
      await exportReviewsReport(selectedPeriod);
      showMessage(t('ownerAnalytics.exportReports.reviewsExported'), 'success');
    } catch (error) {
      showMessage(t('ownerAnalytics.exportReports.exportError'), 'error');
    }
  };

  const handleExportFull = async () => {
    try {
      await exportFullReport(selectedPeriod);
      showMessage(t('ownerAnalytics.exportReports.fullExported'), 'success');
    } catch (error) {
      showMessage(t('ownerAnalytics.exportReports.exportError'), 'error');
    }
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
    return t(`ownerAnalytics.periods.${period}`);
  };

  if (loading) {
    return (
      <div className="owner-loading">
        <div className="owner-loading-spinner"></div>
        <p>{t('ownerAnalytics.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-error">
        <h4>{t('ownerAnalytics.errorTitle')}</h4>
        <p>{error}</p>
        <button onClick={() => refetch()} className="owner-btn owner-btn-primary">
          {t('ownerAnalytics.retry')}
        </button>
      </div>
    );
  }

  const {
    overview = {},
    revenue = {},
    bookings = {},
    campgrounds = {},
    reviews = {},
    trends = {},
    topPerformers = {},
  } = analyticsData || {};

  return (
    <div className={`owner-analytics ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Enhanced Page Header */}
      <div className="owner-page-header">
        <div className="header-content">
          <div className="header-main">
            <div className="greeting-section">
              <h1>{t('ownerAnalytics.title')}</h1>
              <p className="header-subtitle">{t('ownerAnalytics.subtitle')}</p>
            </div>
            <div className="header-stats">
              <div className="header-stat">
                <span className="stat-label">{t('ownerAnalytics.totalRevenue')}</span>
                <span className="stat-value">{formatCurrency(revenue.total)}</span>
              </div>
              <div className="header-stat">
                <span className="stat-label">{t('ownerAnalytics.totalBookings')}</span>
                <span className="stat-value">{formatNumber(bookings.total)}</span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <div className="filter-controls">
              <select
                value={selectedCampground}
                onChange={handleCampgroundChange}
                className="owner-select"
              >
                <option value="all">{t('ownerAnalytics.allCampgrounds')}</option>
                {campgrounds.list?.map((campground) => (
                  <option key={campground._id} value={campground._id}>
                    {campground.title}
                  </option>
                ))}
              </select>
              <select value={selectedPeriod} onChange={handlePeriodChange} className="owner-select">
                <option value="7d">{t('ownerAnalytics.periods.7d')}</option>
                <option value="30d">{t('ownerAnalytics.periods.30d')}</option>
                <option value="90d">{t('ownerAnalytics.periods.90d')}</option>
                <option value="1y">{t('ownerAnalytics.periods.1y')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="analytics-content">
        {/* Enhanced Overview Stats */}
        <div className="analytics-section">
          <div className="section-header">
            <h2>{t('ownerAnalytics.performanceOverview.title')}</h2>
            <p className="section-subtitle">{getPeriodLabel(selectedPeriod)}</p>
          </div>
          <div className="analytics-stats-grid">
            <div className="analytics-stat-card revenue">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(revenue.total)}</div>
                <div className="stat-label">
                  {t('ownerAnalytics.performanceOverview.totalRevenue')}
                </div>
                <div className="stat-change">
                  <span className={revenue.change >= 0 ? 'positive' : 'negative'}>
                    {revenue.change >= 0 ? '↗' : '↘'} {formatPercentage(Math.abs(revenue.change))}
                  </span>
                  <span className="change-label">
                    {t('ownerAnalytics.performanceOverview.vsPreviousPeriod')}
                  </span>
                </div>
              </div>
            </div>

            <div className="analytics-stat-card bookings">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-value">{formatNumber(bookings.total)}</div>
                <div className="stat-label">
                  {t('ownerAnalytics.performanceOverview.totalBookings')}
                </div>
                <div className="stat-change">
                  <span className={bookings.change >= 0 ? 'positive' : 'negative'}>
                    {bookings.change >= 0 ? '↗' : '↘'}{' '}
                    {formatPercentage(Math.abs(bookings.change))}
                  </span>
                  <span className="change-label">
                    {t('ownerAnalytics.performanceOverview.vsPreviousPeriod')}
                  </span>
                </div>
              </div>
            </div>

            <div className="analytics-stat-card occupancy">
              <div className="stat-icon">🏕️</div>
              <div className="stat-content">
                <div className="stat-value">{formatPercentage(overview.occupancyRate)}</div>
                <div className="stat-label">{t('ownerAnalytics.occupancyRate')}</div>
                <div className="stat-change">
                  <span className={overview.occupancyChange >= 0 ? 'positive' : 'negative'}>
                    {overview.occupancyChange >= 0 ? '↗' : '↘'}{' '}
                    {formatPercentage(Math.abs(overview.occupancyChange))}
                  </span>
                  <span className="change-label">{t('ownerAnalytics.vsPreviousPeriod')}</span>
                </div>
              </div>
            </div>

            <div className="analytics-stat-card rating">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-value">{(reviews.averageRating || 0).toFixed(1)}</div>
                <div className="stat-label">{t('ownerAnalytics.averageRating')}</div>
                <div className="stat-change">
                  <span className="neutral">
                    {formatNumber(reviews.totalReviews)} {t('ownerAnalytics.reviews')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Analysis */}
        <div className="analytics-section">
          <div className="section-header">
            <h2>{t('ownerAnalytics.revenueAnalysis.title')}</h2>
            <p className="section-subtitle">{t('ownerAnalytics.revenueAnalysis.subtitle')}</p>
          </div>
          <div className="analytics-grid">
            <div className="owner-card analytics-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>{t('ownerAnalytics.revenueAnalysis.revenueBySource.title')}</h3>
                  <p className="card-subtitle">
                    {t('ownerAnalytics.revenueAnalysis.revenueBySource.subtitle')}
                  </p>
                </div>
              </div>
              <div className="card-content">
                <div className="revenue-sources">
                  {revenue.byCampground?.map((item, index) => (
                    <div key={index} className="revenue-item">
                      <div className="revenue-info">
                        <span className="campground-name">{item.name}</span>
                        <span className="revenue-amount">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="revenue-bar">
                        <div
                          className="revenue-fill"
                          style={{ width: `${(item.amount / revenue.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="revenue-percentage">
                        {formatPercentage((item.amount / revenue.total) * 100)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="owner-card analytics-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>{t('ownerAnalytics.revenueAnalysis.monthlyTrends.title')}</h3>
                  <p className="card-subtitle">
                    {t('ownerAnalytics.revenueAnalysis.monthlyTrends.subtitle')}
                  </p>
                </div>
              </div>
              <div className="card-content">
                <div className="trends-chart">
                  {trends.monthly?.map((month, index) => (
                    <div key={index} className="trend-item">
                      <div className="trend-bar">
                        <div
                          className="trend-fill"
                          style={{
                            height: `${(month.revenue / Math.max(...trends.monthly.map((m) => m.revenue))) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="trend-label">{month.label}</span>
                      <span className="trend-value">{formatCurrency(month.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Analytics */}
        <div className="analytics-section">
          <div className="section-header">
            <h2>{t('ownerAnalytics.bookingAnalytics.title')}</h2>
            <p className="section-subtitle">{t('ownerAnalytics.bookingAnalytics.subtitle')}</p>
          </div>
          <div className="analytics-grid">
            <div className="owner-card analytics-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>{t('ownerAnalytics.bookingAnalytics.statusDistribution.title')}</h3>
                  <p className="card-subtitle">
                    {t('ownerAnalytics.bookingAnalytics.statusDistribution.subtitle')}
                  </p>
                </div>
              </div>
              <div className="card-content">
                <div className="booking-status-grid">
                  <div className="status-item confirmed">
                    <div className="status-count">{bookings.confirmed || 0}</div>
                    <div className="status-label">
                      {t('ownerAnalytics.bookingAnalytics.statusDistribution.confirmed')}
                    </div>
                  </div>
                  <div className="status-item pending">
                    <div className="status-count">{bookings.pending || 0}</div>
                    <div className="status-label">
                      {t('ownerAnalytics.bookingAnalytics.statusDistribution.pending')}
                    </div>
                  </div>
                  <div className="status-item cancelled">
                    <div className="status-count">{bookings.cancelled || 0}</div>
                    <div className="status-label">
                      {t('ownerAnalytics.bookingAnalytics.statusDistribution.cancelled')}
                    </div>
                  </div>
                  <div className="status-item completed">
                    <div className="status-count">{bookings.completed || 0}</div>
                    <div className="status-label">
                      {t('ownerAnalytics.bookingAnalytics.statusDistribution.completed')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="owner-card analytics-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>{t('ownerAnalytics.bookingAnalytics.keyMetrics.title')}</h3>
                  <p className="card-subtitle">
                    {t('ownerAnalytics.bookingAnalytics.keyMetrics.subtitle')}
                  </p>
                </div>
              </div>
              <div className="card-content">
                <div className="metrics-list">
                  <div className="metric-item">
                    <span className="metric-label">
                      {t('ownerAnalytics.bookingAnalytics.keyMetrics.averageBookingValue')}
                    </span>
                    <span className="metric-value">{formatCurrency(bookings.averageValue)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">
                      {t('ownerAnalytics.bookingAnalytics.keyMetrics.averageStayDuration')}
                    </span>
                    <span className="metric-value">
                      {(bookings.averageDuration || 0).toFixed(1)}{' '}
                      {t('ownerAnalytics.bookingAnalytics.keyMetrics.days')}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">
                      {t('ownerAnalytics.bookingAnalytics.keyMetrics.cancellationRate')}
                    </span>
                    <span className="metric-value">
                      {formatPercentage(bookings.cancellationRate)}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">
                      {t('ownerAnalytics.bookingAnalytics.keyMetrics.repeatCustomerRate')}
                    </span>
                    <span className="metric-value">
                      {formatPercentage(bookings.repeatCustomerRate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers & Reviews */}
        <div className="analytics-section">
          <div className="section-header">
            <h2>{t('ownerAnalytics.performanceInsights.title')}</h2>
            <p className="section-subtitle">{t('ownerAnalytics.performanceInsights.subtitle')}</p>
          </div>
          <div className="analytics-grid">
            <div className="owner-card analytics-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>{t('ownerAnalytics.performanceInsights.bestPerforming.title')}</h3>
                  <p className="card-subtitle">
                    {t('ownerAnalytics.performanceInsights.bestPerforming.subtitle')}
                  </p>
                </div>
              </div>
              <div className="card-content">
                <div className="performers-list">
                  {topPerformers.campgrounds?.map((campground, index) => (
                    <div key={index} className="performer-item">
                      <div className="performer-rank">#{index + 1}</div>
                      <div className="performer-info">
                        <div className="performer-name">{campground.name}</div>
                        <div className="performer-stats">
                          <span>
                            {formatCurrency(campground.revenue)}{' '}
                            {t('ownerAnalytics.performanceInsights.bestPerforming.revenue')}
                          </span>
                          <span>•</span>
                          <span>
                            {campground.bookings}{' '}
                            {t('ownerAnalytics.performanceInsights.bestPerforming.bookings')}
                          </span>
                          <span>•</span>
                          <span>⭐ {campground.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="performer-badge">
                        {formatPercentage(campground.occupancyRate)}{' '}
                        {t('ownerAnalytics.performanceInsights.bestPerforming.occupied')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="owner-card analytics-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>{t('ownerAnalytics.performanceInsights.recentReviews.title')}</h3>
                  <p className="card-subtitle">
                    {t('ownerAnalytics.performanceInsights.recentReviews.subtitle')}
                  </p>
                </div>
              </div>
              <div className="card-content">
                <div className="reviews-list">
                  {reviews.recent && reviews.recent.length > 0 ? (
                    reviews.recent.map((review, index) => (
                      <div key={index} className="review-item">
                        <div className="review-header">
                          <div className="review-rating">{'⭐'.repeat(review.rating)}</div>
                          <div className="review-date">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="review-content">{review.body}</div>
                        <div className="review-campground">{review.campground}</div>
                      </div>
                    ))
                  ) : (
                    <div className="no-reviews-message">
                      <p>{t('ownerAnalytics.performanceInsights.recentReviews.noReviews')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Actions */}
        <div className="analytics-section">
          <div className="owner-card export-card">
            <div className="card-header">
              <div className="card-title">
                <h3>{t('ownerAnalytics.exportReports.title')}</h3>
                <p className="card-subtitle">{t('ownerAnalytics.exportReports.subtitle')}</p>
              </div>
            </div>
            <div className="card-content">
              <div className="export-buttons">
                <button className="owner-btn owner-btn-outline" onClick={handleExportRevenue}>
                  📊 {t('ownerAnalytics.exportReports.revenueReport')}
                </button>
                <button className="owner-btn owner-btn-outline" onClick={handleExportBookings}>
                  📅 {t('ownerAnalytics.exportReports.bookingReport')}
                </button>
                <button className="owner-btn owner-btn-outline" onClick={handleExportReviews}>
                  ⭐ {t('ownerAnalytics.exportReports.reviewsReport')}
                </button>
                <button className="owner-btn owner-btn-primary" onClick={handleExportFull}>
                  📋 {t('ownerAnalytics.exportReports.fullReport')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerAnalyticsPage;
