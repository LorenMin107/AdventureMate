import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

/**
 * AdminLayout component provides a consistent layout for all admin pages
 * 
 * @returns {JSX.Element} Admin layout component
 */
const AdminLayout = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  // Check if the current path matches a specific admin route
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="admin-layout-unauthorized">
        <h2>Access Denied</h2>
        <p>You do not have permission to access the admin area.</p>
        <Link to="/" className="admin-layout-home-link">Return to Home</Link>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <div className="admin-navbar">
        <div className="admin-navbar-brand">
          <h2>Admin</h2>
        </div>

        <nav className="admin-nav">
          <Link 
            to="/admin" 
            className={`admin-nav-item ${isActive('/admin') && !isActive('/admin/users') && !isActive('/admin/campgrounds') && !isActive('/admin/bookings') ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">📊</span>
            Dashboard
          </Link>

          <Link 
            to="/admin/users" 
            className={`admin-nav-item ${isActive('/admin/users') ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">👤</span>
            Users
          </Link>

          <Link 
            to="/admin/campgrounds" 
            className={`admin-nav-item ${isActive('/admin/campgrounds') ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">🏕️</span>
            Campgrounds
          </Link>

          <Link 
            to="/admin/bookings" 
            className={`admin-nav-item ${isActive('/admin/bookings') ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">📆</span>
            Bookings
          </Link>

        </nav>
      </div>

      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
