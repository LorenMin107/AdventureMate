import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/api';
import { logError } from '../../utils/logger';
import './AdminDashboard.css';

/**
 * AdminDashboard component displays statistics and recent activity for administrators
 *
 * @returns {JSX.Element} Admin dashboard component
 */
const AdminDashboard = () => {
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

  const fetchDashboardData = useCallback(async (showRefreshIndicator = true) => {
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
        err.response?.data?.message ||
        err.message ||
        'Failed to load dashboard data. Please try again later.';
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
  }, []);

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
    return <div className="admin-dashboard-loading">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="admin-dashboard-error">{error}</div>;
  }

  if (!currentUser?.isAdmin) {
    return (
      <div className="admin-dashboard-unauthorized">
        You do not have permission to access this page.
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1 className="admin-dashboard-title">Admin Dashboard</h1>
        <div className="admin-dashboard-refresh">
          <span className="admin-dashboard-last-updated">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            className={`admin-dashboard-refresh-button ${refreshing ? 'refreshing' : ''}`}
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      <div className="admin-dashboard-stats">
        <div className="admin-stat-card">
          <h3>Total Users</h3>
          <div className="admin-stat-value">{stats?.totalUsers || 0}</div>
          <Link to="/admin/users" className="admin-stat-link">
            Manage Users
          </Link>
        </div>

        <div className="admin-stat-card">
          <h3>Total Campgrounds</h3>
          <div className="admin-stat-value">{stats?.totalCampgrounds || 0}</div>
          <Link to="/admin/campgrounds" className="admin-stat-link">
            Manage Campgrounds
          </Link>
        </div>

        <div className="admin-stat-card">
          <h3>Total Campsites</h3>
          <div className="admin-stat-value">{stats?.totalCampsites || 0}</div>
          <Link to="/admin/campsites" className="admin-stat-link">
            Manage Campsites
          </Link>
        </div>

        <div className="admin-stat-card">
          <h3>Total Bookings</h3>
          <div className="admin-stat-value">{stats?.totalBookings || 0}</div>
          <Link to="/admin/bookings" className="admin-stat-link">
            View All Bookings
          </Link>
        </div>

        <div className="admin-stat-card">
          <h3>Total Reviews</h3>
          <div className="admin-stat-value">{stats?.totalReviews || 0}</div>
          <Link to="/campgrounds" className="admin-stat-link">
            View Campgrounds
          </Link>
        </div>

        <div className="admin-stat-card">
          <h3>Owner Applications</h3>
          <div className="admin-stat-value">{stats?.totalApplications || 0}</div>
          <div className="admin-stat-breakdown">
            <span className="stat-breakdown-item pending">
              {stats?.pendingApplications || 0} Pending
            </span>
            <span className="stat-breakdown-item reviewing">
              {stats?.underReviewApplications || 0} Reviewing
            </span>
          </div>
          <Link to="/admin/owner-applications" className="admin-stat-link">
            Manage Applications
          </Link>
        </div>

        <div className="admin-stat-card">
          <h3>Safety Alerts</h3>
          <div className="admin-stat-value">{stats?.totalSafetyAlerts || 0}</div>
          <div className="admin-stat-breakdown">
            <span className="stat-breakdown-item active">
              {stats?.activeSafetyAlerts || 0} Active
            </span>
          </div>
          <Link to="/admin/safety-alerts" className="admin-stat-link">
            Manage Alerts
          </Link>
        </div>

        <div className="admin-stat-card">
          <h3>User Trips</h3>
          <div className="admin-stat-value">{stats?.totalTrips || 0}</div>
          <div className="admin-stat-breakdown">
            <span className="stat-breakdown-item public">{stats?.publicTrips || 0} Public</span>
            <span className="stat-breakdown-item days">{stats?.totalTripDays || 0} Days</span>
          </div>
          <Link to="/admin/trips" className="admin-stat-link">
            Manage Trips
          </Link>
        </div>
      </div>

      <div className="admin-dashboard-recent">
        <div className="admin-recent-section">
          <h2>Recent Bookings</h2>
          {recentBookings.length > 0 ? (
            <div className="admin-recent-list">
              {recentBookings.map((booking) => (
                <div key={booking._id} className="admin-recent-item">
                  <div className="admin-recent-item-header">
                    <span className="admin-recent-item-title">
                      {booking.campground ? booking.campground.title : 'Campground'}
                    </span>
                    <span className="admin-recent-item-date">
                      {new Date(booking.startDate).toLocaleDateString()} -
                      {new Date(booking.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="admin-recent-item-details">
                    <span>Booked by: {booking.user ? booking.user.username : 'Unknown user'}</span>
                    <span>${booking.totalPrice.toFixed(2)}</span>
                  </div>
                  <Link to={`/admin/bookings/${booking._id}`} className="admin-recent-item-link">
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-no-data">No recent bookings</p>
          )}
          <Link to="/admin/bookings" className="admin-view-all-link">
            View All Bookings
          </Link>
        </div>

        <div className="admin-recent-section">
          <h2>Recent Users</h2>
          {recentUsers.length > 0 ? (
            <div className="admin-recent-list">
              {recentUsers.map((user) => (
                <div key={user._id} className="admin-recent-item">
                  <div className="admin-recent-item-header">
                    <span className="admin-recent-item-title">{user.username}</span>
                    <span className="admin-recent-item-date">
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="admin-recent-item-details">
                    <span>{user.email}</span>
                    <span>{user.isAdmin ? 'Admin' : 'User'}</span>
                  </div>
                  <Link to={`/admin/users/${user._id}`} className="admin-recent-item-link">
                    View Profile
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-no-data">No recent users</p>
          )}
          <Link to="/admin/users" className="admin-view-all-link">
            View All Users
          </Link>
        </div>

        <div className="admin-recent-section">
          <h2>Recent Owner Applications</h2>
          {recentApplications.length > 0 ? (
            <div className="admin-recent-list">
              {recentApplications.map((application) => (
                <div key={application._id} className="admin-recent-item">
                  <div className="admin-recent-item-header">
                    <span className="admin-recent-item-title">{application.businessName}</span>
                    <span className={`admin-recent-item-status ${application.status}`}>
                      {application.status === 'pending'
                        ? 'Pending'
                        : application.status === 'under_review'
                          ? 'Under Review'
                          : application.status === 'approved'
                            ? 'Approved'
                            : 'Rejected'}
                    </span>
                  </div>
                  <div className="admin-recent-item-details">
                    <span>
                      Applicant: {application.user ? application.user.username : 'Unknown user'}
                    </span>
                    <span>Applied: {new Date(application.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Link
                    to={`/admin/owner-applications/${application._id}`}
                    className="admin-recent-item-link"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-no-data">No recent applications</p>
          )}
          <Link to="/admin/owner-applications" className="admin-view-all-link">
            View All Applications
          </Link>
        </div>

        <div className="admin-recent-section">
          <h2>Recent Safety Alerts</h2>
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
                    <span>Type: {alert.type}</span>
                    <span>Status: {alert.status}</span>
                  </div>
                  <div className="admin-recent-item-location">
                    Location: {alert.campground ? alert.campground.title : 'Unknown'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.9rem',
                      color: '#6c757d',
                      fontStyle: 'italic',
                      marginTop: '0.5rem',
                    }}
                  >
                    Use Safety Alerts page to manage
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-no-data">No recent safety alerts</p>
          )}
          <Link to="/admin/safety-alerts" className="admin-view-all-link">
            View All Safety Alerts
          </Link>
        </div>

        <div className="admin-recent-section">
          <h2>Recent User Trips</h2>
          {recentTrips && recentTrips.length > 0 ? (
            <div className="admin-recent-list">
              {recentTrips.map((trip) => (
                <div key={trip._id} className="admin-recent-item">
                  <div className="admin-recent-item-header">
                    <span className="admin-recent-item-title">{trip.title}</span>
                    <span
                      className={`admin-recent-item-status ${trip.isPublic ? 'public' : 'private'}`}
                    >
                      {trip.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                  <div className="admin-recent-item-details">
                    <span>Owner: {trip.user ? trip.user.username : 'Unknown'}</span>
                    <span>
                      {new Date(trip.startDate).toLocaleDateString()} -{' '}
                      {new Date(trip.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <Link to={`/admin/trips/${trip._id}`} className="admin-recent-item-link">
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-no-data">No recent trips</p>
          )}
          <Link to="/admin/trips" className="admin-view-all-link">
            View All Trips
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
