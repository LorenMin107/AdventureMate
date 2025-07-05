import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useFlashMessage } from '../context/FlashMessageContext';
import useOwners from '../hooks/useOwners';
import './OwnerDashboardPage.css';

/**
 * Owner Dashboard Page
 * Main dashboard for campground owners showing key metrics and recent activity
 */
const OwnerDashboardPage = () => {
  const { ownerProfile } = useOutletContext();
  const { showMessage } = useFlashMessage();
  const { useOwnerDashboard } = useOwners();
  
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useOwnerDashboard({
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="owner-loading">
        <div className="owner-loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-error">
        <h4>Error Loading Dashboard</h4>
        <p>There was an error loading your dashboard data. Please try again later.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="owner-btn owner-btn-primary"
        >
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

  return (
    <div className="owner-dashboard">
      {/* Page Header */}
      <div className="owner-page-header">
        <div className="header-content">
          <div>
            <h1>Welcome back, {owner?.businessName || 'Owner'}!</h1>
            <p>Here's what's happening with your campgrounds today.</p>
          </div>
          <div className="header-actions">
            <Link to="/owner/campgrounds/new" className="owner-btn owner-btn-primary">
              <span>➕</span>
              Add Campground
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
                Your account verification is {ownerProfile?.verificationStatusDisplay?.toLowerCase()}. 
                Complete verification to start accepting bookings.
              </p>
            </div>
            <Link to="/owner/verification" className="owner-btn owner-btn-outline">
              Complete Verification
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="owner-stats-grid">
        <div className="owner-stat-card">
          <div className="stat-icon">🏕️</div>
          <div className="stat-value">{owner?.totalCampgrounds || 0}</div>
          <div className="stat-label">Total Campgrounds</div>
        </div>

        <div className="owner-stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{stats?.totalBookings || 0}</div>
          <div className="stat-label">Total Bookings</div>
          <div className="stat-change positive">
            +{stats?.confirmedBookings || 0} confirmed
          </div>
        </div>

        <div className="owner-stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">{formatCurrency(stats?.totalRevenue)}</div>
          <div className="stat-label">Total Revenue</div>
          <div className="stat-change positive">Last 30 days</div>
        </div>

        <div className="owner-stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{stats?.averageRating?.toFixed(1) || '0.0'}</div>
          <div className="stat-label">Average Rating</div>
          <div className="stat-change">
            {stats?.totalReviews || 0} reviews
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Recent Bookings */}
        <div className="owner-card">
          <div className="card-header">
            <h3>Recent Bookings</h3>
            <Link to="/owner/bookings" className="view-all-link">
              View All
            </Link>
          </div>

          {recentBookings && recentBookings.length > 0 ? (
            <div className="bookings-list">
              {recentBookings.slice(0, 5).map((booking) => (
                <div key={booking._id} className="booking-item">
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h4>No Recent Bookings</h4>
              <p>Your recent bookings will appear here once guests start booking your campgrounds.</p>
            </div>
          )}
        </div>

        {/* My Campgrounds */}
        <div className="owner-card">
          <div className="card-header">
            <h3>My Campgrounds</h3>
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
                  </div>
                  <div className="campground-info">
                    <h4>{campground.title}</h4>
                    <p className="campground-location">{campground.location}</p>
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

        {/* Quick Actions */}
        <div className="owner-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions-grid">
            <Link to="/owner/campgrounds/new" className="quick-action-item">
              <div className="action-icon">➕</div>
              <div className="action-text">
                <h4>Add Campground</h4>
                <p>Create a new campground listing</p>
              </div>
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
            </Link>

            <Link to="/owner/analytics" className="quick-action-item">
              <div className="action-icon">📊</div>
              <div className="action-text">
                <h4>View Analytics</h4>
                <p>Check your performance metrics</p>
              </div>
            </Link>

            <Link to="/owner/profile" className="quick-action-item">
              <div className="action-icon">⚙️</div>
              <div className="action-text">
                <h4>Account Settings</h4>
                <p>Update your profile and preferences</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboardPage;