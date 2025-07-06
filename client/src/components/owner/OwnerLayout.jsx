import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './OwnerLayout.css';

/**
 * OwnerLayout component provides a consistent layout for all owner pages
 *
 * @returns {JSX.Element} Owner layout component
 */
const OwnerLayout = () => {
  const { currentUser } = useAuth();
  const { theme, toggleTheme, isSystemTheme } = useTheme();
  const location = useLocation();
  const { ownerProfile } = useOutletContext() || {};
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth <= 768 && isSidebarOpen) {
        const sidebar = document.querySelector('.owner-navbar');
        const toggleBtn = document.querySelector('.sidebar-toggle-btn');
        if (sidebar && !sidebar.contains(event.target) && !toggleBtn?.contains(event.target)) {
          setIsSidebarOpen(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isSidebarOpen]);

  // Check if the current path matches a specific owner route
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const isDashboardActive = () => {
    return location.pathname === '/owner' || location.pathname === '/owner/dashboard';
  };

  const getThemeIcon = () => {
    if (isSystemTheme) {
      return '🌓'; // System theme indicator
    }
    return theme === 'dark' ? '🌙' : '☀️';
  };

  const getThemeTooltip = () => {
    if (isSystemTheme) {
      return 'System theme (auto)';
    }
    return theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`owner-layout ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Mobile Sidebar Toggle Button */}
      <button
        className="sidebar-toggle-btn"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar menu"
        title="Toggle sidebar menu"
      >
        <span className={`hamburger-line ${isSidebarOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-line ${isSidebarOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-line ${isSidebarOpen ? 'open' : ''}`}></span>
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Sidebar Navigation */}
      <div className={`owner-navbar ${isSidebarOpen ? 'open' : ''}`}>
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
          <div className="theme-toggle-section">
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={getThemeTooltip()}
              aria-label={getThemeTooltip()}
            >
              <span className="theme-icon">{getThemeIcon()}</span>
              <span className="theme-label">
                {isSystemTheme ? 'Auto' : theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </button>
          </div>

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
