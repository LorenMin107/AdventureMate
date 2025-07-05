import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logError } from '../utils/logger';
import './EmailVerificationRequired.css';

/**
 * Component shown when a user tries to access a protected route without verifying their email
 * Provides information and options to resend the verification email
 */
const EmailVerificationRequired = () => {
  const { currentUser, logout } = useAuth();
  const [resendStatus, setResendStatus] = useState('idle'); // idle, loading, success, error
  const [resendMessage, setResendMessage] = useState('');
  const [logoutStatus, setLogoutStatus] = useState('idle'); // idle, loading
  const navigate = useNavigate();

  // Handle resend verification email
  const handleResendVerification = async () => {
    setResendStatus('loading');
    setResendMessage('');

    try {
      const response = await apiClient.post('/v1/auth/resend-verification-email');
      setResendStatus('success');
      setResendMessage(response.data.message);
    } catch (error) {
      setResendStatus('error');
      setResendMessage(
        error.response?.data?.message ||
          'Failed to resend verification email. Please try again later.'
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
        <h1>Email Verification Required</h1>
        <div className="verification-message">
          <div className="warning-icon">!</div>
          <h2>Please Verify Your Email</h2>
          <p>
            We've sent a verification email to <strong>{currentUser?.email}</strong>. Please check
            your inbox and click the verification link to activate your account.
          </p>
          <p>You need to verify your email address before you can access this content.</p>
        </div>

        <div className="resend-section">
          <p>Didn't receive the email?</p>

          {resendStatus === 'idle' && (
            <button
              onClick={handleResendVerification}
              className="btn btn-primary"
              disabled={resendStatus === 'loading'}
            >
              Resend Verification Email
            </button>
          )}

          {resendStatus === 'loading' && (
            <div className="resend-loading">
              <div className="spinner-small"></div>
              <span>Sending...</span>
            </div>
          )}

          {resendStatus === 'success' && (
            <div className="resend-success">
              <p>{resendMessage}</p>
              <p>Please check your email for the verification link.</p>
            </div>
          )}

          {resendStatus === 'error' && (
            <div className="resend-error">
              <p>{resendMessage}</p>
              <button onClick={handleResendVerification} className="btn btn-primary">
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="action-buttons">
          <Link to="/" className="btn btn-secondary">
            Go to Homepage
          </Link>
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            disabled={logoutStatus === 'loading'}
          >
            {logoutStatus === 'loading' ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationRequired;
