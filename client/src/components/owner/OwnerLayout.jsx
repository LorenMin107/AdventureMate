import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './OwnerLayout.css';

/**
 * OwnerLayout component provides a consistent layout for all owner pages
 * Now uses a top navigation bar like the admin dashboard
 */
const OwnerLayout = () => {
  const { currentUser } = useAuth();
  const { theme, toggleTheme, isSystemTheme } = useTheme();
  const location = useLocation();
  const { ownerProfile } = useOutletContext() || {};
  const [isScrolled, setIsScrolled] = useState(false);
  const navbarRef = useRef(null);
  const contentRef = useRef(null);

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

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`owner-layout ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Top Navigation Bar */}
      <div
        ref={navbarRef}
        className={`owner-navbar-top ${isScrolled ? 'scrolled' : ''}`}
        style={{
          width: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 999,
        }}
      >
        <div
          className="owner-navbar-main"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}
        >
          {/* Main nav links only, centered */}
          <nav
            className="owner-nav-top"
            style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}
          >
            <Link
              to="/owner/dashboard"
              className={`owner-nav-item-top ${isDashboardActive() ? 'active' : ''}`}
            >
              <span className="owner-nav-icon">📊</span>
              <span className="owner-nav-text">Dashboard</span>
            </Link>
            <Link
              to="/owner/campgrounds"
              className={`owner-nav-item-top ${isActive('/owner/campgrounds') ? 'active' : ''}`}
            >
              <span className="owner-nav-icon">🏕️</span>
              <span className="owner-nav-text">My Campgrounds</span>
            </Link>
            <Link
              to="/owner/bookings"
              className={`owner-nav-item-top ${isActive('/owner/bookings') ? 'active' : ''}`}
            >
              <span className="owner-nav-icon">📆</span>
              <span className="owner-nav-text">Bookings</span>
            </Link>
            <Link
              to="/owner/analytics"
              className={`owner-nav-item-top ${isActive('/owner/analytics') ? 'active' : ''}`}
            >
              <span className="owner-nav-icon">📈</span>
              <span className="owner-nav-text">Analytics</span>
            </Link>
            <Link
              to="/owner/profile"
              className={`owner-nav-item-top ${isActive('/owner/profile') ? 'active' : ''}`}
            >
              <span className="owner-nav-icon">⚙️</span>
              <span className="owner-nav-text">Settings</span>
            </Link>
            {ownerProfile?.verificationStatus !== 'verified' && (
              <Link
                to="/owner/verification"
                className={`owner-nav-item-top verification-required ${isActive('/owner/verification') ? 'active' : ''}`}
              >
                <span className="owner-nav-icon">🔒</span>
                <span className="owner-nav-text">Verification</span>
                <span className="notification-dot"></span>
              </Link>
            )}
          </nav>
        </div>
      </div>
      {/* Main Content Area with padding for navbar */}
      <div ref={contentRef} className="owner-content" style={{ paddingTop: '100px' }}>
        <Outlet context={{ ownerProfile }} />
      </div>
    </div>
  );
};

export default React.memo(OwnerLayout);
