import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logError } from '../utils/logger';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './common/LanguageSwitcher';
import './Header.css';

const Header = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  // Check if user is authenticated but email is not verified
  const isEmailVerified = currentUser?.isEmailVerified ?? false;
  const showAuthenticatedLinks = isAuthenticated && isEmailVerified;

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
    } catch (error) {
      logError('Logout failed', error);
    }
  };

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          AdventureMate
        </Link>
        <nav className="nav">
          <div className="nav-controls">
            <LanguageSwitcher className="header-language-switcher" />
          </div>
          <ul className="nav-list">
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
    </header>
  );
};

export default Header;
