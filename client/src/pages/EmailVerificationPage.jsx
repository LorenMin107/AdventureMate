import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../utils/api';
import { logInfo } from '../utils/logger';
import './EmailVerificationPage.css';

const EmailVerificationPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [resendStatus, setResendStatus] = useState('idle'); // idle, loading, success, error
  const [resendMessage, setResendMessage] = useState('');

  // Verify email token on component mount
  useEffect(() => {
    const verifyEmail = async () => {
      logInfo('EmailVerificationPage mounted');
      logInfo('Token from URL', { token });

      if (!token) {
        logInfo('No token found in URL');
        setStatus('error');
        setMessage(t('emailVerification.error.noToken'));
        return;
      }

      try {
        logInfo('Sending verification request to server');
        // Send the token as-is to the server
        logInfo('Token to send', { token });
        const response = await apiClient.get(`/auth/verify-email?token=${token}`);
        logInfo('Verification response', response.data);
        setStatus('success');
        setMessage(response.data.message);
        setUser(response.data.user);
      } catch (error) {
        logInfo('Verification error', error);
        logInfo('Error response', error.response?.data);
        setStatus('error');
        setMessage(error.response?.data?.message || t('emailVerification.error.failed'));
      }
    };

    verifyEmail();
  }, [token]);

  // Handle resend verification email
  const handleResendVerification = async () => {
    setResendStatus('loading');
    setResendMessage('');

    try {
      const response = await apiClient.post('/auth/resend-verification-email');
      setResendStatus('success');
      setResendMessage(response.data.message);
    } catch (error) {
      setResendStatus('error');
      setResendMessage(error.response?.data?.message || t('emailVerification.resend.failed'));
    }
  };

  return (
    <div className="email-verification-page">
      <div className="verification-container">
        <h1>{t('emailVerification.title')}</h1>

        {status === 'loading' && (
          <div className="verification-status loading">
            <div className="spinner"></div>
            <p>{t('emailVerification.verifying')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="verification-status success">
            <div className="success-icon">✓</div>
            <h2>{t('emailVerification.success.title')}</h2>
            <p>{message}</p>
            {user && (
              <div className="user-info">
                <p>Username: {user.username}</p>
                <p>Email: {user.email}</p>
              </div>
            )}
            <div className="action-buttons">
              <Link to="/login" className="btn btn-primary">
                {t('emailVerification.success.login')}
              </Link>
              <Link to="/" className="btn btn-secondary">
                {t('emailVerification.success.goToHomepage')}
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="verification-status error">
            <div className="error-icon">✗</div>
            <h2>{t('emailVerification.error.title')}</h2>
            <p>{message}</p>
            <div className="resend-section">
              <p>{t('emailVerification.resend.title')}</p>

              {resendStatus === 'idle' && (
                <button
                  onClick={handleResendVerification}
                  className="btn btn-primary"
                  disabled={resendStatus === 'loading'}
                >
                  {t('emailVerification.resend.button')}
                </button>
              )}

              {resendStatus === 'loading' && (
                <div className="resend-loading">
                  <div className="spinner-small"></div>
                  <span>{t('emailVerification.resend.sending')}</span>
                </div>
              )}

              {resendStatus === 'success' && (
                <div className="resend-success">
                  <p>{resendMessage}</p>
                  <p>{t('emailVerification.resend.success')}</p>
                </div>
              )}

              {resendStatus === 'error' && (
                <div className="resend-error">
                  <p>{resendMessage}</p>
                  <button onClick={handleResendVerification} className="btn btn-primary">
                    {t('emailVerification.resend.tryAgain')}
                  </button>
                </div>
              )}
            </div>
            <div className="action-buttons">
              <Link to="/login" className="btn btn-secondary">
                {t('emailVerification.backToLogin')}
              </Link>
              <Link to="/" className="btn btn-secondary">
                {t('emailVerification.success.goToHomepage')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
