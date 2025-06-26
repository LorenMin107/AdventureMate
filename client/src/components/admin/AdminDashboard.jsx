import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/dashboard', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }

        const data = await response.json();
        setStats(data.stats);
        setRecentBookings(data.recentBookings || []);
        setRecentUsers(data.recentUsers || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="admin-dashboard-loading">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="admin-dashboard-error">{error}</div>;
  }

  if (!currentUser?.isAdmin) {
    return <div className="admin-dashboard-unauthorized">You do not have permission to access this page.</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1 className="admin-dashboard-title">Admin Dashboard</h1>
      
      <div className="admin-dashboard-stats">
        <div className="admin-stat-card">
          <h3>Total Users</h3>
          <div className="admin-stat-value">{stats?.totalUsers || 0}</div>
          <Link to="/admin/users" className="admin-stat-link">Manage Users</Link>
        </div>
        
        <div className="admin-stat-card">
          <h3>Total Campgrounds</h3>
          <div className="admin-stat-value">{stats?.totalCampgrounds || 0}</div>
          <Link to="/admin/campgrounds" className="admin-stat-link">Manage Campgrounds</Link>
        </div>
        
        <div className="admin-stat-card">
          <h3>Total Bookings</h3>
          <div className="admin-stat-value">{stats?.totalBookings || 0}</div>
          <Link to="/admin/bookings" className="admin-stat-link">View All Bookings</Link>
        </div>
        
        <div className="admin-stat-card">
          <h3>Total Reviews</h3>
          <div className="admin-stat-value">{stats?.totalReviews || 0}</div>
          <Link to="/campgrounds" className="admin-stat-link">View Campgrounds</Link>
        </div>
      </div>
      
      <div className="admin-dashboard-recent">
        <div className="admin-recent-section">
          <h2>Recent Bookings</h2>
          {recentBookings.length > 0 ? (
            <div className="admin-recent-list">
              {recentBookings.map(booking => (
                <div key={booking._id} className="admin-recent-item">
                  <div className="admin-recent-item-header">
                    <span className="admin-recent-item-title">
                      {booking.campground.title}
                    </span>
                    <span className="admin-recent-item-date">
                      {new Date(booking.startDate).toLocaleDateString()} - 
                      {new Date(booking.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="admin-recent-item-details">
                    <span>Booked by: {booking.user.username}</span>
                    <span>${booking.totalPrice.toFixed(2)}</span>
                  </div>
                  <Link 
                    to={`/admin/bookings/${booking._id}`} 
                    className="admin-recent-item-link"
                  >
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
              {recentUsers.map(user => (
                <div key={user._id} className="admin-recent-item">
                  <div className="admin-recent-item-header">
                    <span className="admin-recent-item-title">
                      {user.username}
                    </span>
                    <span className="admin-recent-item-date">
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="admin-recent-item-details">
                    <span>{user.email}</span>
                    <span>{user.isAdmin ? 'Admin' : 'User'}</span>
                  </div>
                  <Link 
                    to={`/admin/users/${user._id}`} 
                    className="admin-recent-item-link"
                  >
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
      </div>
    </div>
  );
};

export default AdminDashboard;