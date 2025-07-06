import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useFlashMessage } from '../context/FlashMessageContext';
import { useTheme } from '../context/ThemeContext';
import useOwners from '../hooks/useOwners';
import './OwnerDashboardPage.css';

/**
 * Owner Dashboard Page
 * Modern dashboard for campground owners showing key metrics and recent activity
 */
const OwnerDashboardPage = () => {
  const { ownerProfile } = useOutletContext();
  const { showMessage } = useFlashMessage();
  const { theme } = useTheme();
  const { useOwnerDashboard } = useOwners();

  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useOwnerDashboard({
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="owner-loading">
        <div className="owner-loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-error">
        <h4>Error Loading Dashboard</h4>
        <p>There was an error loading your dashboard data. Please try again later.</p>
        <button onClick={() => window.location.reload()} className="owner-btn owner-btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const { owner, stats, recentBookings, campgrounds } = dashboardData || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getRevenueChange = () => {
    if (!stats?.revenueChange) return null;
    const change = stats.revenueChange;
    return {
      value: Math.abs(change),
      isPositive: change > 0,
      percentage: Math.abs((change / (stats.totalRevenue - change)) * 100).toFixed(1),
    };
  };

  const revenueChange = getRevenueChange();

  return (
    <div className={`owner-dashboard ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Enhanced Page Header */}
      <div className="owner-page-header">
        <div className="header-content">
          <div className="header-main">
            <div className="greeting-section">
              <h1>
                {getGreeting()}, {owner?.businessName || 'Owner'}! 👋
              </h1>
              <p className="header-subtitle">
                Here's your business overview for{' '}
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="header-stats">
              <div className="header-stat">
                <span className="stat-label">Active Campgrounds</span>
                <span className="stat-value">{owner?.totalCampgrounds || 0}</span>
              </div>
              <div className="header-stat">
                <span className="stat-label">Today's Bookings</span>
                <span className="stat-value">{stats?.todayBookings || 0}</span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <Link to="/owner/campgrounds/new" className="owner-btn owner-btn-primary">
              <span className="btn-icon">➕</span>
              Add Campground
            </Link>
            <Link to="/owner/analytics" className="owner-btn owner-btn-secondary">
              <span className="btn-icon">📊</span>
              Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Verification Alert */}
      {ownerProfile?.verificationStatus !== 'verified' && (
        <div className="verification-alert">
          <div className="alert-content">
            <div className="alert-icon">🔒</div>
            <div className="alert-text">
              <h4>Complete Your Verification</h4>
              <p>
                Your account verification is{' '}
                <strong>{ownerProfile?.verificationStatusDisplay?.toLowerCase()}</strong>. Complete
                verification to start accepting bookings and receiving payments.
              </p>
            </div>
            <Link to="/owner/verification" className="owner-btn owner-btn-outline">
              Complete Verification
            </Link>
          </div>
        </div>
      )}

      {/* Enhanced Stats Grid */}
      <div className="owner-stats-grid">
        <div className="owner-stat-card revenue-card">
          <div className="stat-header">
            <div className="stat-icon">💰</div>
            <div className="stat-trend">
              {revenueChange && (
                <span
                  className={`trend-indicator ${revenueChange.isPositive ? 'positive' : 'negative'}`}
                >
                  {revenueChange.isPositive ? '↗' : '↘'} {revenueChange.percentage}%
                </span>
              )}
            </div>
          </div>
          <div className="stat-value">{formatCurrency(stats?.totalRevenue)}</div>
          <div className="stat-label">Total Revenue</div>
          <div className="stat-period">Last 30 days</div>
        </div>

        <div className="owner-stat-card bookings-card">
          <div className="stat-header">
            <div className="stat-icon">📅</div>
            <div className="stat-trend">
              <span className="trend-indicator positive">
                ↗ {stats?.confirmedBookings || 0} confirmed
              </span>
            </div>
          </div>
          <div className="stat-value">{stats?.totalBookings || 0}</div>
          <div className="stat-label">Total Bookings</div>
          <div className="stat-period">All time</div>
        </div>

        <div className="owner-stat-card campgrounds-card">
          <div className="stat-header">
            <div className="stat-icon">🏕️</div>
            <div className="stat-trend">
              <span className="trend-indicator neutral">
                {stats?.activeCampgrounds || 0} active
              </span>
            </div>
          </div>
          <div className="stat-value">{owner?.totalCampgrounds || 0}</div>
          <div className="stat-label">Campgrounds</div>
          <div className="stat-period">Total listings</div>
        </div>

        <div className="owner-stat-card rating-card">
          <div className="stat-header">
            <div className="stat-icon">⭐</div>
            <div className="stat-trend">
              <span className="trend-indicator neutral">{stats?.totalReviews || 0} reviews</span>
            </div>
          </div>
          <div className="stat-value">{stats?.averageRating?.toFixed(1) || '0.0'}</div>
          <div className="stat-label">Average Rating</div>
          <div className="stat-period">Customer satisfaction</div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Enhanced Recent Bookings */}
        <div className="owner-card bookings-card">
          <div className="card-header">
            <div className="card-title">
              <h3>Recent Bookings</h3>
              <span className="card-subtitle">Latest customer reservations</span>
            </div>
            <Link to="/owner/bookings" className="view-all-link">
              View All Bookings
            </Link>
          </div>

          {recentBookings && recentBookings.length > 0 ? (
            <div className="bookings-list">
              {recentBookings.slice(0, 5).map((booking) => (
                <div key={booking._id} className="booking-item">
                  <div className="booking-avatar">
                    <div className="avatar-circle">
                      {booking.user?.username?.charAt(0).toUpperCase() || 'G'}
                    </div>
                  </div>
                  <div className="booking-info">
                    <div className="booking-guest">
                      <strong>{booking.user?.username || 'Guest'}</strong>
                      <span className="booking-email">{booking.user?.email}</span>
                    </div>
                    <div className="booking-details">
                      <span className="campground-name">{booking.campground?.title}</span>
                      <span className="booking-dates">
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </span>
                    </div>
                  </div>
                  <div className="booking-meta">
                    <div className="booking-amount">{formatCurrency(booking.totalPrice)}</div>
                    <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status}
                    </span>
                    <span className="booking-time">{formatTime(booking.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h4>No Recent Bookings</h4>
              <p>
                Your recent bookings will appear here once guests start booking your campgrounds.
              </p>
              <Link to="/owner/campgrounds/new" className="owner-btn owner-btn-outline">
                Add Your First Campground
              </Link>
            </div>
          )}
        </div>

        {/* Enhanced My Campgrounds */}
        <div className="owner-card campgrounds-card">
          <div className="card-header">
            <div className="card-title">
              <h3>My Campgrounds</h3>
              <span className="card-subtitle">Manage your listings</span>
            </div>
            <Link to="/owner/campgrounds" className="view-all-link">
              Manage All
            </Link>
          </div>

          {campgrounds && campgrounds.length > 0 ? (
            <div className="campgrounds-grid">
              {campgrounds.slice(0, 4).map((campground) => (
                <div key={campground._id} className="campground-card">
                  <div className="campground-image">
                    {campground.images && campground.images.length > 0 ? (
                      <img
                        src={campground.images[0].url}
                        alt={campground.title}
                        onError={(e) => {
                          e.target.src = '/placeholder-campground.jpg';
                        }}
                      />
                    ) : (
                      <div className="placeholder-image">
                        <span>🏕️</span>
                      </div>
                    )}
                    <div className="campground-overlay">
                      <div className="campground-rating">
                        <span className="rating-star">⭐</span>
                        <span className="rating-value">
                          {campground.rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="campground-info">
                    <h4>{campground.title}</h4>
                    <p className="campground-location">{campground.location}</p>
                    <div className="campground-stats">
                      <span className="stat">${campground.price}/night</span>
                      <span className="stat">{campground.reviews?.length || 0} reviews</span>
                    </div>
                    <div className="campground-actions">
                      <Link
                        to={`/owner/campgrounds/${campground._id}`}
                        className="owner-btn owner-btn-secondary"
                      >
                        Manage
                      </Link>
                      <Link
                        to={`/campgrounds/${campground._id}`}
                        className="owner-btn owner-btn-outline"
                        target="_blank"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏕️</div>
              <h4>No Campgrounds Yet</h4>
              <p>Start by adding your first campground to begin accepting bookings.</p>
              <Link to="/owner/campgrounds/new" className="owner-btn owner-btn-primary">
                Add Your First Campground
              </Link>
            </div>
          )}
        </div>

        {/* Enhanced Quick Actions */}
        <div className="owner-card quick-actions-card">
          <div className="card-header">
            <div className="card-title">
              <h3>Quick Actions</h3>
              <span className="card-subtitle">Common tasks</span>
            </div>
          </div>
          <div className="quick-actions-grid">
            <Link to="/owner/campgrounds/new" className="quick-action-item">
              <div className="action-icon">➕</div>
              <div className="action-text">
                <h4>Add Campground</h4>
                <p>Create a new campground listing</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/owner/bookings?status=pending" className="quick-action-item">
              <div className="action-icon">⏳</div>
              <div className="action-text">
                <h4>Pending Bookings</h4>
                <p>Review and approve bookings</p>
              </div>
              {stats?.pendingBookings > 0 && (
                <div className="action-badge">{stats.pendingBookings}</div>
              )}
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/owner/analytics" className="quick-action-item">
              <div className="action-icon">📊</div>
              <div className="action-text">
                <h4>View Analytics</h4>
                <p>Check your performance metrics</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/owner/profile" className="quick-action-item">
              <div className="action-icon">⚙️</div>
              <div className="action-text">
                <h4>Account Settings</h4>
                <p>Update your profile and preferences</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="owner-card insights-card">
          <div className="card-header">
            <div className="card-title">
              <h3>Performance Insights</h3>
              <span className="card-subtitle">This month's highlights</span>
            </div>
          </div>
          <div className="insights-grid">
            <div className="insight-item">
              <div className="insight-icon">📈</div>
              <div className="insight-content">
                <h4>Revenue Growth</h4>
                <p>
                  {revenueChange
                    ? `${revenueChange.isPositive ? '+' : '-'}${revenueChange.percentage}% from last month`
                    : 'No data available'}
                </p>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon">👥</div>
              <div className="insight-content">
                <h4>Customer Satisfaction</h4>
                <p>
                  {stats?.averageRating
                    ? `${stats.averageRating.toFixed(1)}/5.0 average rating`
                    : 'No reviews yet'}
                </p>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon">🎯</div>
              <div className="insight-content">
                <h4>Occupancy Rate</h4>
                <p>
                  {stats?.occupancyRate
                    ? `${stats.occupancyRate.toFixed(1)}% average occupancy`
                    : 'Calculating...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboardPage;
