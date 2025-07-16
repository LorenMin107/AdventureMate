import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import './AdminLayout.css';

/**
 * AdminLayout component provides a consistent layout for all admin pages
 *
 * @returns {JSX.Element} Admin layout component
 */
const AdminLayout = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(60);
  const [adminNavbarHeight, setAdminNavbarHeight] = useState(80);
  const navbarRef = useRef(null);
  const contentRef = useRef(null);

  // Check if the current path matches a specific admin route
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Calculate main header height and set admin navbar position
  useEffect(() => {
    const calculateHeaderHeight = () => {
      const mainHeader = document.querySelector('.header');
      if (mainHeader) {
        const height = mainHeader.offsetHeight;
        setHeaderHeight(height);

        // Update navbar position dynamically
        if (navbarRef.current) {
          navbarRef.current.style.top = `${height}px`;
        }
      }
    };

    // Calculate admin navbar height
    const calculateAdminNavbarHeight = () => {
      if (navbarRef.current) {
        const height = navbarRef.current.offsetHeight;
        setAdminNavbarHeight(height);

        // Update content padding dynamically
        if (contentRef.current) {
          const totalOffset = headerHeight + height;
          contentRef.current.style.paddingTop = `calc(1rem + ${totalOffset}px)`;
          contentRef.current.style.minHeight = `calc(100vh - ${totalOffset}px)`;
        }
      }
    };

    // Calculate on mount with multiple attempts to ensure DOM is ready
    const attemptCalculation = () => {
      calculateHeaderHeight();
      calculateAdminNavbarHeight();
    };

    // Initial calculation
    attemptCalculation();

    // Multiple attempts with increasing delays to ensure DOM is ready
    const timers = [
      setTimeout(attemptCalculation, 50),
      setTimeout(attemptCalculation, 100),
      setTimeout(attemptCalculation, 200),
      setTimeout(attemptCalculation, 500),
    ];

    // Use MutationObserver to detect when header is added to DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const header = document.querySelector('.header');
          if (header) {
            attemptCalculation();
            observer.disconnect(); // Stop observing once header is found
          }
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Recalculate on resize
    const handleResize = () => {
      calculateHeaderHeight();
      calculateAdminNavbarHeight();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      timers.forEach((timer) => clearTimeout(timer));
      observer.disconnect();
    };
  }, [headerHeight]);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!currentUser?.isAdmin) {
    return (
      <div className="admin-layout-unauthorized">
        <h2>{t('adminNavigation.accessDenied')}</h2>
        <p>{t('adminNavigation.accessDeniedMessage')}</p>
        <Link to="/" className="admin-layout-home-link">
          {t('adminNavigation.returnToHome')}
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <div
        ref={navbarRef}
        className={`admin-navbar ${isScrolled ? 'scrolled' : ''}`}
        style={{
          top: `${headerHeight}px`,
          position: 'fixed',
          zIndex: 999,
        }}
      >
        {/* Main navigation section */}
        <div className="admin-navbar-main">
          <nav className="admin-nav">
            {/* Core Management Group */}
            <div className="admin-nav-group">
              <Link
                to="/admin"
                className={`admin-nav-item ${isActive('/admin') && !isActive('/admin/users') && !isActive('/admin/campgrounds') && !isActive('/admin/bookings') && !isActive('/admin/owner-applications') && !isActive('/admin/analytics') ? 'active' : ''}`}
              >
                <span className="admin-nav-icon">📊</span>
                <span className="admin-nav-text">{t('adminNavigation.dashboard')}</span>
              </Link>

              <Link
                to="/admin/analytics"
                className={`admin-nav-item ${isActive('/admin/analytics') ? 'active' : ''}`}
              >
                <span className="admin-nav-icon">📈</span>
                <span className="admin-nav-text">{t('adminNavigation.analytics')}</span>
              </Link>

              <Link
                to="/admin/users"
                className={`admin-nav-item ${isActive('/admin/users') ? 'active' : ''}`}
              >
                <span className="admin-nav-icon">👤</span>
                <span className="admin-nav-text">{t('adminNavigation.users')}</span>
              </Link>

              <Link
                to="/admin/campgrounds"
                className={`admin-nav-item ${isActive('/admin/campgrounds') ? 'active' : ''}`}
              >
                <span className="admin-nav-icon">🏕️</span>
                <span className="admin-nav-text">{t('adminNavigation.campgrounds')}</span>
              </Link>

              <Link
                to="/admin/bookings"
                className={`admin-nav-item ${isActive('/admin/bookings') ? 'active' : ''}`}
              >
                <span className="admin-nav-icon">📆</span>
                <span className="admin-nav-text">{t('adminNavigation.bookings')}</span>
              </Link>
            </div>

            {/* Divider */}
            <div className="admin-nav-divider"></div>

            {/* Applications & Safety Group */}
            <div className="admin-nav-group">
              <Link
                to="/admin/owner-applications"
                className={`admin-nav-item ${isActive('/admin/owner-applications') ? 'active' : ''}`}
              >
                <span className="admin-nav-icon">📋</span>
                <span className="admin-nav-text">{t('adminNavigation.applications')}</span>
              </Link>

              <Link
                to="/admin/safety-alerts"
                className={`admin-nav-item ${isActive('/admin/safety-alerts') ? 'active' : ''}`}
              >
                <span className="admin-nav-icon">⚠️</span>
                <span className="admin-nav-text">{t('adminNavigation.safetyAlerts')}</span>
              </Link>
            </div>

            {/* Divider */}
            <div className="admin-nav-divider"></div>

            {/* Content & Monitoring Group */}
            <div className="admin-nav-group">
              <Link
                to="/admin/trips"
                className={`admin-nav-item ${isActive('/admin/trips') ? 'active' : ''}`}
              >
                <span className="admin-nav-icon">🗺️</span>
                <span className="admin-nav-text">{t('adminNavigation.trips')}</span>
              </Link>

              <Link
                to="/admin/weather"
                className={`admin-nav-item ${isActive('/admin/weather') ? 'active' : ''}`}
              >
                <span className="admin-nav-icon">🌤️</span>
                <span className="admin-nav-text">{t('adminNavigation.weather')}</span>
              </Link>
            </div>
          </nav>
        </div>
      </div>

      <div
        ref={contentRef}
        className="admin-content"
        style={{
          paddingTop: `calc(1rem + ${headerHeight + adminNavbarHeight}px)`,
          minHeight: `calc(100vh - ${headerHeight + adminNavbarHeight}px)`,
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
