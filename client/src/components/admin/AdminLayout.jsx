import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import './AdminLayout.css';

/**
 * AdminLayout component provides a consistent layout for all admin pages
 *
 * @returns {JSX.Element} Admin layout component
 */
const AdminLayout = () => {
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
        console.log('Main header height:', height); // Debug log
        setHeaderHeight(height);

        // Update navbar position dynamically
        if (navbarRef.current) {
          navbarRef.current.style.top = `${height}px`;
          console.log('Setting navbar top to:', height + 'px'); // Debug log
        }
      } else {
        console.log('Main header not found'); // Debug log
      }
    };

    // Calculate admin navbar height
    const calculateAdminNavbarHeight = () => {
      if (navbarRef.current) {
        const height = navbarRef.current.offsetHeight;
        setAdminNavbarHeight(height);
        console.log('Admin navbar height:', height); // Debug log

        // Update content padding dynamically
        if (contentRef.current) {
          const totalOffset = headerHeight + height;
          contentRef.current.style.paddingTop = `calc(2rem + ${totalOffset}px)`;
          contentRef.current.style.minHeight = `calc(100vh - ${totalOffset}px)`;
          console.log('Setting content padding to:', `calc(2rem + ${totalOffset}px)`); // Debug log
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
            console.log('Header found via MutationObserver'); // Debug log
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
        <h2>Access Denied</h2>
        <p>You do not have permission to access the admin area.</p>
        <Link to="/" className="admin-layout-home-link">
          Return to Home
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
            <Link
              to="/admin"
              className={`admin-nav-item ${isActive('/admin') && !isActive('/admin/users') && !isActive('/admin/campgrounds') && !isActive('/admin/bookings') && !isActive('/admin/owner-applications') ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">📊</span>
              <span className="admin-nav-text">Dashboard</span>
            </Link>

            <Link
              to="/admin/users"
              className={`admin-nav-item ${isActive('/admin/users') ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">👤</span>
              <span className="admin-nav-text">Users</span>
            </Link>

            <Link
              to="/admin/campgrounds"
              className={`admin-nav-item ${isActive('/admin/campgrounds') ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">🏕️</span>
              <span className="admin-nav-text">Campgrounds</span>
            </Link>

            <Link
              to="/admin/bookings"
              className={`admin-nav-item ${isActive('/admin/bookings') ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">📆</span>
              <span className="admin-nav-text">Bookings</span>
            </Link>

            <Link
              to="/admin/owner-applications"
              className={`admin-nav-item ${isActive('/admin/owner-applications') ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">📋</span>
              <span className="admin-nav-text">Applications</span>
            </Link>
          </nav>
        </div>
      </div>

      <div
        ref={contentRef}
        className="admin-content"
        style={{
          paddingTop: `calc(2rem + ${headerHeight + adminNavbarHeight}px)`,
          minHeight: `calc(100vh - ${headerHeight + adminNavbarHeight}px)`,
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
