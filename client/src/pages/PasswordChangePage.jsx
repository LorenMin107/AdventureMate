import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import PasswordChangeForm from '../components/PasswordChangeForm';
import { logError } from '../utils/logger';
import './PasswordChangePage.css';

/**
 * PasswordChangePage component
 * Dedicated page for changing user password
 */
const PasswordChangePage = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Check if user is a Google OAuth user
  const isGoogleUser = currentUser?.googleId;

  // If user is a Google OAuth user, show a message and redirect
  if (isGoogleUser) {
    return (
      <div className={`password-change-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
        <div className="page-container">
          <div className="page-header">
            <h1>{t('passwordChange.changePassword')}</h1>
            <p>{t('passwordChange.keepAccountSecure')}</p>
          </div>

          <div className="page-content">
            <div className="google-oauth-notice">
              <div className="notice-icon">🔐</div>
              <h2>{t('passwordChange.googleOAuthTitle') || 'Google Account Detected'}</h2>
              <p>
                {t('passwordChange.googleOAuthMessage') ||
                  'You are signed in with a Google account. Password changes are managed through your Google account settings.'}
              </p>
              <div className="notice-actions">
                <button onClick={() => navigate('/profile')} className="back-button">
                  {t('passwordChange.backToProfile')}
                </button>
                <a
                  href="https://myaccount.google.com/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="google-settings-link"
                >
                  {t('passwordChange.openGoogleSettings') || 'Open Google Account Settings'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`password-change-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <div className="page-container">
        <div className="page-header">
          <h1>{t('passwordChange.changePassword')}</h1>
          <p>{t('passwordChange.keepAccountSecure')}</p>
        </div>

        <div className="page-content">
          <PasswordChangeForm />
        </div>

        <div className="page-footer">
          <button onClick={() => navigate('/profile')} className="back-button">
            {t('passwordChange.backToProfile')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangePage;
