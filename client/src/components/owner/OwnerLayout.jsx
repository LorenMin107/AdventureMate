import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import './OwnerLayout.css';

/**
 * OwnerLayout component provides a consistent layout for all owner pages
 * 
 * @returns {JSX.Element} Owner layout component
 */
const OwnerLayout = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const { ownerProfile } = useOutletContext() || {};

  // Check if the current path matches a specific owner route
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const isDashboardActive = () => {
    return location.pathname === '/owner' || location.pathname === '/owner/dashboard';
  };

  return (
    <div className="owner-layout">
      <div className="owner-navbar">
        <div className="owner-navbar-brand">
          <h2>Owner Dashboard</h2>
          {ownerProfile && (
            <div className="owner-info">
              <span className="business-name">{ownerProfile.businessName}</span>
              <span className={`verification-badge status-${ownerProfile.verificationStatus}`}>
                {ownerProfile.verificationStatusDisplay}
              </span>
            </div>
          )}
        </div>

        <nav className="owner-nav">
          <Link 
            to="/owner/dashboard" 
            className={`owner-nav-item ${isDashboardActive() ? 'active' : ''}`}
          >
            <span className="owner-nav-icon">📊</span>
            Dashboard
          </Link>

          <Link 
            to="/owner/campgrounds" 
            className={`owner-nav-item ${isActive('/owner/campgrounds') ? 'active' : ''}`}
          >
            <span className="owner-nav-icon">🏕️</span>
            My Campgrounds
          </Link>

          <Link 
            to="/owner/bookings" 
            className={`owner-nav-item ${isActive('/owner/bookings') ? 'active' : ''}`}
          >
            <span className="owner-nav-icon">📆</span>
            Bookings
          </Link>

          <Link 
            to="/owner/analytics" 
            className={`owner-nav-item ${isActive('/owner/analytics') ? 'active' : ''}`}
          >
            <span className="owner-nav-icon">📈</span>
            Analytics
          </Link>

          <Link 
            to="/owner/profile" 
            className={`owner-nav-item ${isActive('/owner/profile') ? 'active' : ''}`}
          >
            <span className="owner-nav-icon">⚙️</span>
            Settings
          </Link>

          {ownerProfile?.verificationStatus !== 'verified' && (
            <Link 
              to="/owner/verification" 
              className={`owner-nav-item verification-required ${isActive('/owner/verification') ? 'active' : ''}`}
            >
              <span className="owner-nav-icon">🔒</span>
              Verification
              <span className="notification-dot"></span>
            </Link>
          )}
        </nav>

        <div className="owner-nav-footer">
          <Link to="/" className="back-to-site">
            <span className="owner-nav-icon">🏠</span>
            Back to Site
          </Link>
          
          <div className="owner-user-info">
            <span className="user-name">{currentUser?.username}</span>
            <span className="user-email">{currentUser?.email}</span>
          </div>
        </div>
      </div>

      <div className="owner-content">
        <Outlet context={{ ownerProfile }} />
      </div>
    </div>
  );
};

export default OwnerLayout;