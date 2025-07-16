import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFlashMessage } from '../context/FlashMessageContext';
import { useTheme } from '../context/ThemeContext';
import useOwners from '../hooks/useOwners';
import './OwnerDashboardPage.css';

/**
 * Owner Dashboard Page
 * Modern dashboard for campground owners showing key metrics and recent activity
 */
const OwnerDashboardPage = () => {
  const { t } = useTranslation();
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
        <p>{t('ownerDashboard.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-error">
        <h4>{t('ownerDashboard.errorTitle')}</h4>
        <p>{t('ownerDashboard.errorMessage')}</p>
        <button onClick={() => window.location.reload()} className="owner-btn owner-btn-primary">
          {t('ownerDashboard.retry')}
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
    if (hour < 12) return t('ownerDashboard.greeting.morning');
    if (hour < 17) return t('ownerDashboard.greeting.afternoon');
    return t('ownerDashboard.greeting.evening');
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
                {t('ownerDashboard.headerSubtitle', {
                  date: currentTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }),
                })}
              </p>
            </div>
            <div className="header-stats">
              <div className="header-stat">
                <span className="stat-label">{t('ownerDashboard.activeCampgrounds')}</span>
                <span className="stat-value">{owner?.totalCampgrounds || 0}</span>
              </div>
              <div className="header-stat">
                <span className="stat-label">{t('ownerDashboard.todayBookings')}</span>
                <span className="stat-value">{stats?.todayBookings || 0}</span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <Link to="/owner/campgrounds/new" className="owner-btn owner-btn-primary">
              <span className="btn-icon">➕</span>
              {t('ownerDashboard.addCampground')}
            </Link>
            <Link to="/owner/analytics" className="owner-btn owner-btn-secondary">
              <span className="btn-icon">📊</span>
              {t('ownerDashboard.analytics')}
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
              <h4>{t('ownerDashboard.verificationAlert.title')}</h4>
              <p>
                {t('ownerDashboard.verificationAlert.message', {
                  status: ownerProfile?.verificationStatusDisplay?.toLowerCase(),
                })}
              </p>
            </div>
            <Link to="/owner/verification" className="owner-btn owner-btn-outline">
              {t('ownerDashboard.verificationAlert.button')}
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
          <div className="stat-label">{t('ownerDashboard.stats.totalRevenue')}</div>
          <div className="stat-period">{t('ownerDashboard.stats.last30Days')}</div>
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
          <div className="stat-label">{t('ownerDashboard.stats.totalBookings')}</div>
          <div className="stat-period">{t('ownerDashboard.stats.allTime')}</div>
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
          <div className="stat-label">{t('ownerDashboard.stats.campgrounds')}</div>
          <div className="stat-period">{t('ownerDashboard.stats.totalListings')}</div>
        </div>

        <div className="owner-stat-card rating-card">
          <div className="stat-header">
            <div className="stat-icon">⭐</div>
            <div className="stat-trend">
              <span className="trend-indicator neutral">{stats?.totalReviews || 0} reviews</span>
            </div>
          </div>
          <div className="stat-value">{stats?.averageRating?.toFixed(1) || '0.0'}</div>
          <div className="stat-label">{t('ownerDashboard.stats.averageRating')}</div>
          <div className="stat-period">{t('ownerDashboard.stats.customerSatisfaction')}</div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Enhanced Recent Bookings */}
        <div className="owner-card bookings-card">
          <div className="card-header">
            <div className="card-title">
              <h3>{t('ownerDashboard.recentBookings.title')}</h3>
              <span className="card-subtitle">{t('ownerDashboard.recentBookings.subtitle')}</span>
            </div>
            <Link to="/owner/bookings" className="view-all-link">
              {t('ownerDashboard.recentBookings.viewAll')}
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
                      <strong>{booking.user?.username || t('ownerBookings.guest')}</strong>
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
              <h4>{t('ownerDashboard.recentBookings.noBookings')}</h4>
              <p>{t('ownerDashboard.recentBookings.noBookingsMessage')}</p>
              <Link to="/owner/campgrounds/new" className="owner-btn owner-btn-outline">
                {t('ownerDashboard.recentBookings.addFirstCampground')}
              </Link>
            </div>
          )}
        </div>

        {/* Enhanced My Campgrounds */}
        <div className="owner-card campgrounds-card">
          <div className="card-header">
            <div className="card-title">
              <h3>{t('ownerDashboard.myCampgrounds.title')}</h3>
              <span className="card-subtitle">{t('ownerDashboard.myCampgrounds.subtitle')}</span>
            </div>
            <Link to="/owner/campgrounds" className="view-all-link">
              {t('ownerDashboard.myCampgrounds.manageAll')}
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
                      <span className="stat">
                        ${campground.price}/{t('ownerDashboard.myCampgrounds.perNight')}
                      </span>
                      <span className="stat">
                        {campground.reviews?.length || 0}{' '}
                        {t('ownerDashboard.myCampgrounds.reviews')}
                      </span>
                    </div>
                    <div className="campground-actions">
                      <Link
                        to={`/owner/campgrounds/${campground._id}`}
                        className="owner-btn owner-btn-secondary"
                      >
                        {t('ownerDashboard.myCampgrounds.manage')}
                      </Link>
                      <Link
                        to={`/campgrounds/${campground._id}`}
                        className="owner-btn owner-btn-outline"
                        target="_blank"
                      >
                        {t('ownerDashboard.myCampgrounds.view')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏕️</div>
              <h4>{t('ownerDashboard.myCampgrounds.noCampgrounds')}</h4>
              <p>{t('ownerDashboard.myCampgrounds.noCampgroundsMessage')}</p>
              <Link to="/owner/campgrounds/new" className="owner-btn owner-btn-primary">
                {t('ownerDashboard.myCampgrounds.addFirstCampground')}
              </Link>
            </div>
          )}
        </div>

        {/* Enhanced Quick Actions */}
        <div className="owner-card quick-actions-card">
          <div className="card-header">
            <div className="card-title">
              <h3>{t('ownerDashboard.quickActions.title')}</h3>
              <span className="card-subtitle">{t('ownerDashboard.quickActions.subtitle')}</span>
            </div>
          </div>
          <div className="quick-actions-grid">
            <Link to="/owner/campgrounds/new" className="quick-action-item">
              <div className="action-icon">➕</div>
              <div className="action-text">
                <h4>{t('ownerDashboard.quickActions.addCampground.title')}</h4>
                <p>{t('ownerDashboard.quickActions.addCampground.description')}</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/owner/bookings?status=pending" className="quick-action-item">
              <div className="action-icon">⏳</div>
              <div className="action-text">
                <h4>{t('ownerDashboard.quickActions.pendingBookings.title')}</h4>
                <p>{t('ownerDashboard.quickActions.pendingBookings.description')}</p>
              </div>
              {stats?.pendingBookings > 0 && (
                <div className="action-badge">{stats.pendingBookings}</div>
              )}
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/owner/analytics" className="quick-action-item">
              <div className="action-icon">📊</div>
              <div className="action-text">
                <h4>{t('ownerDashboard.quickActions.viewAnalytics.title')}</h4>
                <p>{t('ownerDashboard.quickActions.viewAnalytics.description')}</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/owner/profile" className="quick-action-item">
              <div className="action-icon">⚙️</div>
              <div className="action-text">
                <h4>{t('ownerDashboard.quickActions.accountSettings.title')}</h4>
                <p>{t('ownerDashboard.quickActions.accountSettings.description')}</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="owner-card insights-card">
          <div className="card-header">
            <div className="card-title">
              <h3>{t('ownerDashboard.performanceInsights.title')}</h3>
              <span className="card-subtitle">
                {t('ownerDashboard.performanceInsights.subtitle')}
              </span>
            </div>
          </div>
          <div className="insights-grid">
            <div className="insight-item">
              <div className="insight-icon">📈</div>
              <div className="insight-content">
                <h4>{t('ownerDashboard.performanceInsights.revenueGrowth.title')}</h4>
                <p>
                  {revenueChange
                    ? t(
                        `ownerDashboard.performanceInsights.revenueGrowth.${revenueChange.isPositive ? 'positive' : 'negative'}`,
                        { percentage: revenueChange.percentage }
                      )
                    : t('ownerDashboard.performanceInsights.revenueGrowth.noData')}
                </p>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon">👥</div>
              <div className="insight-content">
                <h4>{t('ownerDashboard.performanceInsights.customerSatisfaction.title')}</h4>
                <p>
                  {stats?.averageRating
                    ? t('ownerDashboard.performanceInsights.customerSatisfaction.rating', {
                        rating: stats.averageRating.toFixed(1),
                      })
                    : t('ownerDashboard.performanceInsights.customerSatisfaction.noReviews')}
                </p>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon">🎯</div>
              <div className="insight-content">
                <h4>{t('ownerDashboard.performanceInsights.occupancyRate.title')}</h4>
                <p>
                  {stats?.occupancyRate
                    ? t('ownerDashboard.performanceInsights.occupancyRate.rate', {
                        rate: stats.occupancyRate.toFixed(1),
                      })
                    : t('ownerDashboard.performanceInsights.occupancyRate.calculating')}
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
