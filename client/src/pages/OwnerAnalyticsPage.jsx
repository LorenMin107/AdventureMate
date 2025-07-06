import { useState, useEffect } from 'react';
import { useFlashMessage } from '../context/FlashMessageContext';
import { useTheme } from '../context/ThemeContext';
import useOwners from '../hooks/useOwners';
import './OwnerAnalyticsPage.css';

/**
 * Owner Analytics Page
 * Modern analytics dashboard for campground owners
 */
const OwnerAnalyticsPage = () => {
  const { showMessage } = useFlashMessage();
  const { theme } = useTheme();
  const { useOwnerAnalytics } = useOwners();

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
      setError('Failed to load analytics data. Please try again later.');
      setLoading(false);
    }
  }, [fetchError]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
  };

  const handleCampgroundChange = (e) => {
    setSelectedCampground(e.target.value);
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
    switch (period) {
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
      case '90d':
        return 'Last 3 Months';
      case '1y':
        return 'Last Year';
      default:
        return 'Last 30 Days';
    }
  };

  if (loading) {
    return (
      <div className="owner-loading">
        <div className="owner-loading-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-error">
        <h4>Error Loading Analytics</h4>
        <p>{error}</p>
        <button onClick={() => refetch()} className="owner-btn owner-btn-primary">
          Retry
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
              <h1>Analytics & Reports</h1>
              <p className="header-subtitle">
                Track your campground performance and gain valuable insights
              </p>
            </div>
            <div className="header-stats">
              <div className="header-stat">
                <span className="stat-label">Total Revenue</span>
                <span className="stat-value">{formatCurrency(revenue.total)}</span>
              </div>
              <div className="header-stat">
                <span className="stat-label">Total Bookings</span>
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
                <option value="all">All Campgrounds</option>
                {campgrounds.list?.map((campground) => (
                  <option key={campground._id} value={campground._id}>
                    {campground.title}
                  </option>
                ))}
              </select>
              <select value={selectedPeriod} onChange={handlePeriodChange} className="owner-select">
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 3 Months</option>
                <option value="1y">Last Year</option>
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
            <h2>Performance Overview</h2>
            <p className="section-subtitle">{getPeriodLabel(selectedPeriod)}</p>
          </div>
          <div className="analytics-stats-grid">
            <div className="analytics-stat-card revenue">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(revenue.total)}</div>
                <div className="stat-label">Total Revenue</div>
                <div className="stat-change">
                  <span className={revenue.change >= 0 ? 'positive' : 'negative'}>
                    {revenue.change >= 0 ? '↗' : '↘'} {formatPercentage(Math.abs(revenue.change))}
                  </span>
                  <span className="change-label">vs previous period</span>
                </div>
              </div>
            </div>

            <div className="analytics-stat-card bookings">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-value">{formatNumber(bookings.total)}</div>
                <div className="stat-label">Total Bookings</div>
                <div className="stat-change">
                  <span className={bookings.change >= 0 ? 'positive' : 'negative'}>
                    {bookings.change >= 0 ? '↗' : '↘'}{' '}
                    {formatPercentage(Math.abs(bookings.change))}
                  </span>
                  <span className="change-label">vs previous period</span>
                </div>
              </div>
            </div>

            <div className="analytics-stat-card occupancy">
              <div className="stat-icon">🏕️</div>
              <div className="stat-content">
                <div className="stat-value">{formatPercentage(overview.occupancyRate)}</div>
                <div className="stat-label">Occupancy Rate</div>
                <div className="stat-change">
                  <span className={overview.occupancyChange >= 0 ? 'positive' : 'negative'}>
                    {overview.occupancyChange >= 0 ? '↗' : '↘'}{' '}
                    {formatPercentage(Math.abs(overview.occupancyChange))}
                  </span>
                  <span className="change-label">vs previous period</span>
                </div>
              </div>
            </div>

            <div className="analytics-stat-card rating">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-value">{(reviews.averageRating || 0).toFixed(1)}</div>
                <div className="stat-label">Average Rating</div>
                <div className="stat-change">
                  <span className="neutral">{formatNumber(reviews.totalReviews)} reviews</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Analysis */}
        <div className="analytics-section">
          <div className="section-header">
            <h2>Revenue Analysis</h2>
            <p className="section-subtitle">Breakdown of your revenue sources</p>
          </div>
          <div className="analytics-grid">
            <div className="owner-card analytics-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>Revenue by Source</h3>
                  <p className="card-subtitle">Revenue distribution across campgrounds</p>
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
                  <h3>Monthly Trends</h3>
                  <p className="card-subtitle">Revenue trends over time</p>
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
            <h2>Booking Analytics</h2>
            <p className="section-subtitle">Detailed booking performance metrics</p>
          </div>
          <div className="analytics-grid">
            <div className="owner-card analytics-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>Booking Status Distribution</h3>
                  <p className="card-subtitle">Current booking status breakdown</p>
                </div>
              </div>
              <div className="card-content">
                <div className="booking-status-grid">
                  <div className="status-item confirmed">
                    <div className="status-count">{bookings.confirmed || 0}</div>
                    <div className="status-label">Confirmed</div>
                  </div>
                  <div className="status-item pending">
                    <div className="status-count">{bookings.pending || 0}</div>
                    <div className="status-label">Pending</div>
                  </div>
                  <div className="status-item cancelled">
                    <div className="status-count">{bookings.cancelled || 0}</div>
                    <div className="status-label">Cancelled</div>
                  </div>
                  <div className="status-item completed">
                    <div className="status-count">{bookings.completed || 0}</div>
                    <div className="status-label">Completed</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="owner-card analytics-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>Key Performance Metrics</h3>
                  <p className="card-subtitle">Important business indicators</p>
                </div>
              </div>
              <div className="card-content">
                <div className="metrics-list">
                  <div className="metric-item">
                    <span className="metric-label">Average Booking Value</span>
                    <span className="metric-value">{formatCurrency(bookings.averageValue)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Average Stay Duration</span>
                    <span className="metric-value">
                      {(bookings.averageDuration || 0).toFixed(1)} days
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Cancellation Rate</span>
                    <span className="metric-value">
                      {formatPercentage(bookings.cancellationRate)}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Repeat Customer Rate</span>
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
            <h2>Performance Insights</h2>
            <p className="section-subtitle">Top performers and customer feedback</p>
          </div>
          <div className="analytics-grid">
            <div className="owner-card analytics-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>Best Performing Campgrounds</h3>
                  <p className="card-subtitle">Top revenue generators</p>
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
                          <span>{formatCurrency(campground.revenue)} revenue</span>
                          <span>•</span>
                          <span>{campground.bookings} bookings</span>
                          <span>•</span>
                          <span>⭐ {campground.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="performer-badge">
                        {formatPercentage(campground.occupancyRate)} occupied
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="owner-card analytics-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>Recent Customer Reviews</h3>
                  <p className="card-subtitle">Latest feedback from guests</p>
                </div>
              </div>
              <div className="card-content">
                <div className="reviews-list">
                  {reviews.recent?.map((review, index) => (
                    <div key={index} className="review-item">
                      <div className="review-header">
                        <div className="review-rating">{'⭐'.repeat(review.rating)}</div>
                        <div className="review-date">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="review-content">{review.comment}</div>
                      <div className="review-campground">{review.campground}</div>
                    </div>
                  ))}
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
                <h3>Export Reports</h3>
                <p className="card-subtitle">Download detailed reports for analysis</p>
              </div>
            </div>
            <div className="card-content">
              <div className="export-buttons">
                <button className="owner-btn owner-btn-outline">📊 Export Revenue Report</button>
                <button className="owner-btn owner-btn-outline">📅 Export Booking Report</button>
                <button className="owner-btn owner-btn-outline">⭐ Export Reviews Report</button>
                <button className="owner-btn owner-btn-primary">📋 Export Full Report</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerAnalyticsPage;
