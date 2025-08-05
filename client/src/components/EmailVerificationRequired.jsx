import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logError } from '../utils/logger';
import { useTranslation } from 'react-i18next';
import './EmailVerificationRequired.css';

/**
 * Component shown when a user tries to access a protected route without verifying their email
 * Provides information and options to resend the verification email
 */
const EmailVerificationRequired = () => {
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const [resendStatus, setResendStatus] = useState('idle'); // idle, loading, success, error
  const [resendMessage, setResendMessage] = useState('');
  const [logoutStatus, setLogoutStatus] = useState('idle'); // idle, loading
  const navigate = useNavigate();

  // Handle resend verification email
  const handleResendVerification = async () => {
    setResendStatus('loading');
    setResendMessage('');

    try {
      const response = await apiClient.post('/resend-verification-email-unauthenticated', {
        email: currentUser?.email || '',
      });
      setResendStatus('success');
      setResendMessage(response.data.message);
    } catch (error) {
      setResendStatus('error');
      setResendMessage(
        error.response?.data?.message ||
          t('commonErrors.failedToCreate', { item: 'verification email' })
      );
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setLogoutStatus('loading');
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      logError('Logout failed', error);
      setLogoutStatus('idle');
    }
  };

  return (
    <div className="email-verification-required">
      <div className="verification-container">
        <h1>{t('emailVerification.required.title')}</h1>
        <div className="verification-message">
          <div className="warning-icon">!</div>
          <h2>{t('emailVerification.required.heading')}</h2>
          <p>{t('emailVerification.required.message', { email: currentUser?.email })}</p>
          <p>{t('emailVerification.required.requirement')}</p>
        </div>

        <div className="resend-section">
          <p>{t('emailVerification.required.didntReceive')}</p>

          {resendStatus === 'idle' && (
            <button
              onClick={handleResendVerification}
              className="btn btn-primary"
              disabled={resendStatus === 'loading'}
            >
              {t('emailVerification.required.resendButton')}
            </button>
          )}

          {resendStatus === 'loading' && (
            <div className="resend-loading">
              <div className="spinner-small"></div>
              <span>{t('emailVerification.required.sending')}</span>
            </div>
          )}

          {resendStatus === 'success' && (
            <div className="resend-success">
              <p>{resendMessage}</p>
              <p>{t('emailVerification.required.checkEmail')}</p>
            </div>
          )}

          {resendStatus === 'error' && (
            <div className="resend-error">
              <p>{resendMessage}</p>
              <button onClick={handleResendVerification} className="btn btn-primary">
                {t('emailVerification.required.tryAgain')}
              </button>
            </div>
          )}
        </div>

        <div className="action-buttons">
          <Link to="/" className="btn btn-secondary">
            {t('notFound.goToHomepage')}
          </Link>
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            disabled={logoutStatus === 'loading'}
          >
            {logoutStatus === 'loading'
              ? t('emailVerification.required.loggingOut')
              : t('emailVerification.required.logout')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationRequired;
