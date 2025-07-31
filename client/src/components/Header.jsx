import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logError } from '../utils/logger';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import LanguageSwitcher from './common/LanguageSwitcher';
import ThemeToggle from './common/ThemeToggle';
import './Header.css';

const Header = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if user is authenticated but email is not verified
  const isEmailVerified = currentUser?.isEmailVerified ?? false;
  const showAuthenticatedLinks = isAuthenticated && isEmailVerified;

  // Ensure mobile menu is closed on initial load
  useEffect(() => {
    setIsMobileMenuOpen(false);
    // Ensure body scroll is enabled on initial load
    document.body.style.overflow = 'unset';
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileMenuOpen &&
        !event.target.closest('.nav-list') &&
        !event.target.closest('.mobile-menu-toggle')
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      setIsMobileMenuOpen(false);
    } catch (error) {
      logError('Logout failed', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          AdventureMate
        </Link>

        {/* Mobile menu toggle */}
        <button
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className="nav">
          <div className="nav-controls">
            <LanguageSwitcher className="header-language-switcher" />
            <ThemeToggle />
          </div>
          <ul className={`nav-list ${isMobileMenuOpen ? 'active' : ''}`}>
            <li className="nav-item">
              <NavLink
                to="/"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                end
              >
                {t('navigation.home')}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/campgrounds"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                {t('navigation.campgrounds')}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/forum"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                {t('navigation.forum')}
              </NavLink>
            </li>
            {showAuthenticatedLinks && (
              <li className="nav-item">
                <NavLink
                  to="/trips"
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  {t('navigation.tripPlanner')}
                </NavLink>
              </li>
            )}
            {isAuthenticated ? (
              <>
                {showAuthenticatedLinks ? (
                  <>
                    <li className="nav-item">
                      <NavLink
                        to="/profile"
                        className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                      >
                        {t('navigation.profile')}
                      </NavLink>
                    </li>
                    {!currentUser?.isAdmin && (
                      <li className="nav-item">
                        <NavLink
                          to="/bookings"
                          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                        >
                          {t('navigation.bookings')}
                        </NavLink>
                      </li>
                    )}
                    {currentUser?.isAdmin && (
                      <li className="nav-item">
                        <NavLink
                          to="/admin"
                          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                        >
                          {t('navigation.admin')}
                        </NavLink>
                      </li>
                    )}
                    {currentUser?.isOwner && (
                      <li className="nav-item">
                        <NavLink
                          to="/owner"
                          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                        >
                          {t('navigation.owner')}
                        </NavLink>
                      </li>
                    )}
                    <li className="nav-item">
                      <a href="#" onClick={handleLogout} className="nav-link">
                        {t('navigation.logout')}
                      </a>
                    </li>
                  </>
                ) : (
                  <li className="nav-item">
                    <NavLink
                      to="/verify-email-required"
                      className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                    >
                      {t('auth.verifyEmail')}
                    </NavLink>
                  </li>
                )}
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink
                    to="/login"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                  >
                    {t('navigation.login')}
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/register"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                  >
                    {t('navigation.register')}
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>
    </header>
  );
};

export default Header;
