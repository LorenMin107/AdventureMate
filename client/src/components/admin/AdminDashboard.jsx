import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@context/AuthContext';
import apiClient from '../../utils/api';
import { logError } from '@utils/logger';
import './AdminDashboard.css';

/**
 * AdminDashboard component displays statistics and recent activity for administrators
 *
 * @returns {JSX.Element} Admin dashboard component
 */
const AdminDashboard = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [recentSafetyAlerts, setRecentSafetyAlerts] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchDashboardData = useCallback(
    async (showRefreshIndicator = true) => {
      try {
        if (showRefreshIndicator) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await apiClient.get('/admin/dashboard/enhanced');

        // Handle the ApiResponse format
        const responseData = response.data;
        const data = responseData.data || responseData; // Handle both ApiResponse format and direct data
        setStats(data.stats);
        setRecentBookings(data.recentBookings || []);
        setRecentUsers(data.recentUsers || []);
        setRecentApplications(data.recentApplications || []);
        setRecentSafetyAlerts(data.recentSafetyAlerts || []);
        setRecentTrips(data.recentTrips || []);
        setError(null);
        setLastRefreshed(new Date());
      } catch (err) {
        logError('Error fetching dashboard data', err);
        // Improved error handling for axios errors
        const errorMessage =
          err.response?.data?.message || err.message || t('adminDashboard.failedToLoadData');
        setError(errorMessage);

        // If it's an authentication error, return false to stop auto-refresh
        if (err.response?.status === 401 || err.response?.status === 403) {
          return false;
        }
      } finally {
        setRefreshing(false);
        setLoading(false);
      }
      return true;
    },
    [t]
  );

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  // Set up auto-refresh interval (every 30 seconds)
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      const shouldContinue = await fetchDashboardData(true);
      if (!shouldContinue) {
        clearInterval(refreshInterval);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, [fetchDashboardData]);

  if (loading) {
    return <div className="admin-dashboard-loading">{t('adminDashboard.loadingData')}</div>;
  }

  if (error) {
    return <div className="admin-dashboard-error">{error}</div>;
  }

  if (!currentUser?.isAdmin) {
    return <div className="admin-dashboard-unauthorized">{t('adminDashboard.noPermission')}</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1 className="admin-dashboard-title">{t('adminDashboard.title')}</h1>
        <div className="admin-dashboard-refresh">
          <span className="admin-dashboard-last-updated">
            {t('adminDashboard.lastUpdated')}: {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            className={`admin-dashboard-refresh-button ${refreshing ? 'refreshing' : ''}`}
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
          >
            {refreshing ? t('adminDashboard.refreshing') : t('adminDashboard.refreshData')}
          </button>
        </div>
      </div>

      <div className="admin-dashboard-stats">
        <div className="admin-stat-card">
          <h3>{t('adminDashboard.totalUsers')}</h3>
          <div className="admin-stat-value">{stats?.totalUsers || 0}</div>
          <Link to="/admin/users" className="admin-stat-link">
            {t('adminDashboard.manageUsers')}
          </Link>
        </div>

        <div className="admin-stat-card">
          <h3>{t('adminDashboard.totalCampgrounds')}</h3>
          <div className="admin-stat-value">{stats?.totalCampgrounds || 0}</div>
          <Link to="/admin/campgrounds" className="admin-stat-link">
            {t('adminDashboard.manageCampgrounds')}
          </Link>
        </div>

        <div className="admin-stat-card">
          <h3>{t('adminDashboard.totalCampsites')}</h3>
          <div className="admin-stat-value">{stats?.totalCampsites || 0}</div>
          <Link to="/admin/campsites" className="admin-stat-link">
            {t('adminDashboard.manageCampsites')}
          </Link>
        </div>

        <div className="admin-stat-card">
          <h3>{t('adminDashboard.totalBookings')}</h3>
          <div className="admin-stat-value">{stats?.totalBookings || 0}</div>
          <Link to="/admin/bookings" className="admin-stat-link">
            {t('adminDashboard.viewAllBookings')}
          </Link>
        </div>

        <div className="admin-stat-card">
          <h3>{t('adminDashboard.totalReviews')}</h3>
          <div className="admin-stat-value">{stats?.totalReviews || 0}</div>
          <Link to="/campgrounds" className="admin-stat-link">
            {t('adminDashboard.viewCampgrounds')}
          </Link>
        </div>

        <div className="admin-stat-card">
          <h3>{t('adminDashboard.ownerApplications')}</h3>
          <div className="admin-stat-value">{stats?.totalApplications || 0}</div>
          <div className="admin-stat-breakdown">
            <span className="stat-breakdown-item pending">
              {stats?.pendingApplications || 0} {t('adminDashboard.pending')}
            </span>
            <span className="stat-breakdown-item reviewing">
              {stats?.underReviewApplications || 0} {t('adminDashboard.reviewing')}
            </span>
          </div>
          <Link to="/admin/owner-applications" className="admin-stat-link">
            {t('adminDashboard.manageApplications')}
          </Link>
        </div>

        <div className="admin-stat-card">
          <h3>{t('adminDashboard.safetyAlerts')}</h3>
          <div className="admin-stat-value">{stats?.totalSafetyAlerts || 0}</div>
          <div className="admin-stat-breakdown">
            <span className="stat-breakdown-item active">
              {stats?.activeSafetyAlerts || 0} {t('adminDashboard.active')}
            </span>
          </div>
          <Link to="/admin/safety-alerts" className="admin-stat-link">
            {t('adminDashboard.manageAlerts')}
          </Link>
        </div>

        <div className="admin-stat-card">
          <h3>{t('adminDashboard.userTrips')}</h3>
          <div className="admin-stat-value">{stats?.totalTrips || 0}</div>
          <div className="admin-stat-breakdown">
            <span className="stat-breakdown-item public">
              {stats?.publicTrips || 0} {t('adminDashboard.public')}
            </span>
            <span className="stat-breakdown-item days">
              {stats?.totalTripDays || 0} {t('adminDashboard.days')}
            </span>
          </div>
          <Link to="/admin/trips" className="admin-stat-link">
            {t('adminDashboard.manageTrips')}
          </Link>
        </div>
      </div>

      <div className="admin-dashboard-recent">
        <div className="admin-recent-section">
          <h2>{t('adminDashboard.recentBookings')}</h2>
          {recentBookings.length > 0 ? (
            <div className="admin-recent-list">
              {recentBookings.map((booking) => (
                <div key={booking._id} className="admin-recent-item">
                  <div className="admin-recent-item-header">
                    <span className="admin-recent-item-title">
                      {booking.campground
                        ? booking.campground.title
                        : t('adminDashboard.campground')}
                    </span>
                    <span className="admin-recent-item-date">
                      {new Date(booking.startDate).toLocaleDateString()} -
                      {new Date(booking.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="admin-recent-item-details">
                    <span>
                      {t('adminDashboard.bookedBy')}:{' '}
                      {booking.user ? booking.user.username : t('adminDashboard.unknownUser')}
                    </span>
                    <span>${booking.totalPrice.toFixed(2)}</span>
                  </div>
                  <Link to={`/admin/bookings/${booking._id}`} className="admin-recent-item-link">
                    {t('adminDashboard.viewDetails')}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-no-data">{t('adminDashboard.noRecentBookings')}</p>
          )}
          <Link to="/admin/bookings" className="admin-view-all-link">
            {t('adminDashboard.viewAllBookings')}
          </Link>
        </div>

        <div className="admin-recent-section">
          <h2>{t('adminDashboard.recentUsers')}</h2>
          {recentUsers.length > 0 ? (
            <div className="admin-recent-list">
              {recentUsers.map((user) => (
                <div key={user._id} className="admin-recent-item">
                  <div className="admin-recent-item-header">
                    <span className="admin-recent-item-title">{user.username}</span>
                    <span className="admin-recent-item-date">
                      {t('adminDashboard.joined')}: {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="admin-recent-item-details">
                    <span>{user.email}</span>
                    <span>
                      {user.isAdmin ? t('adminDashboard.admin') : t('adminDashboard.user')}
                    </span>
                  </div>
                  <Link to={`/admin/users/${user._id}`} className="admin-recent-item-link">
                    {t('adminDashboard.viewProfile')}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-no-data">{t('adminDashboard.noRecentUsers')}</p>
          )}
          <Link to="/admin/users" className="admin-view-all-link">
            {t('adminDashboard.viewAllUsers')}
          </Link>
        </div>

        <div className="admin-recent-section">
          <h2>{t('adminDashboard.recentOwnerApplications')}</h2>
          {recentApplications.length > 0 ? (
            <div className="admin-recent-list">
              {recentApplications.map((application) => (
                <div key={application._id} className="admin-recent-item">
                  <div className="admin-recent-item-header">
                    <span className="admin-recent-item-title">{application.businessName}</span>
                    <span className={`admin-recent-item-status ${application.status}`}>
                      {application.status === 'pending'
                        ? t('adminDashboard.pending')
                        : application.status === 'under_review'
                          ? t('adminDashboard.underReview')
                          : application.status === 'approved'
                            ? t('adminDashboard.approved')
                            : t('adminDashboard.rejected')}
                    </span>
                  </div>
                  <div className="admin-recent-item-details">
                    <span>
                      {t('adminDashboard.applicant')}:{' '}
                      {application.user
                        ? application.user.username
                        : t('adminDashboard.unknownUser')}
                    </span>
                    <span>
                      {t('adminDashboard.applied')}:{' '}
                      {new Date(application.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Link
                    to={`/admin/owner-applications/${application._id}`}
                    className="admin-recent-item-link"
                  >
                    {t('adminDashboard.viewDetails')}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-no-data">{t('adminDashboard.noRecentApplications')}</p>
          )}
          <Link to="/admin/owner-applications" className="admin-view-all-link">
            {t('adminDashboard.viewAllApplications')}
          </Link>
        </div>

        <div className="admin-recent-section">
          <h2>{t('adminDashboard.recentSafetyAlerts')}</h2>
          {recentSafetyAlerts && recentSafetyAlerts.length > 0 ? (
            <div className="admin-recent-list">
              {recentSafetyAlerts.map((alert) => (
                <div key={alert._id} className="admin-recent-item">
                  <div className="admin-recent-item-header">
                    <span className="admin-recent-item-title">{alert.title}</span>
                    <span className={`admin-recent-item-status ${alert.severity}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="admin-recent-item-details">
                    <span>
                      {t('adminDashboard.type')}: {alert.type}
                    </span>
                    <span>
                      {t('adminDashboard.status')}: {alert.status}
                    </span>
                  </div>
                  <div className="admin-recent-item-location">
                    {t('adminDashboard.location')}:{' '}
                    {alert.campground ? alert.campground.title : t('adminDashboard.unknown')}
                  </div>
                  <div
                    style={{
                      fontSize: '0.9rem',
                      color: '#6c757d',
                      fontStyle: 'italic',
                      marginTop: '0.5rem',
                    }}
                  >
                    {t('adminDashboard.useSafetyAlertsPage')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-no-data">{t('adminDashboard.noRecentSafetyAlerts')}</p>
          )}
          <Link to="/admin/safety-alerts" className="admin-view-all-link">
            {t('adminDashboard.viewAllSafetyAlerts')}
          </Link>
        </div>

        <div className="admin-recent-section">
          <h2>{t('adminDashboard.recentUserTrips')}</h2>
          {recentTrips && recentTrips.length > 0 ? (
            <div className="admin-recent-list">
              {recentTrips.map((trip) => (
                <div key={trip._id} className="admin-recent-item">
                  <div className="admin-recent-item-header">
                    <span className="admin-recent-item-title">{trip.title}</span>
                    <span
                      className={`admin-recent-item-status ${trip.isPublic ? 'public' : 'private'}`}
                    >
                      {trip.isPublic ? t('adminDashboard.public') : t('adminDashboard.private')}
                    </span>
                  </div>
                  <div className="admin-recent-item-details">
                    <span>
                      {t('adminDashboard.owner')}:{' '}
                      {trip.user ? trip.user.username : t('adminDashboard.unknown')}
                    </span>
                    <span>
                      {new Date(trip.startDate).toLocaleDateString()} -{' '}
                      {new Date(trip.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <Link to={`/admin/trips/${trip._id}`} className="admin-recent-item-link">
                    {t('adminDashboard.viewDetails')}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-no-data">{t('adminDashboard.noRecentTrips')}</p>
          )}
          <Link to="/admin/trips" className="admin-view-all-link">
            {t('adminDashboard.viewAllTrips')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
