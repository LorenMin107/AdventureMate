import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import apiClient from '../utils/api';
import './EmailVerificationPage.css';

const EmailVerificationPage = () => {
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
      console.log('EmailVerificationPage mounted');
      console.log('Token from URL:', token);

      if (!token) {
        console.log('No token found in URL');
        setStatus('error');
        setMessage('No verification token provided. Please check your email link.');
        return;
      }

      try {
        console.log('Sending verification request to server');
        // Send the token as-is to the server
        console.log('Token to send:', token);
        const response = await apiClient.get(`/v1/auth/verify-email?token=${token}`);
        console.log('Verification response:', response.data);
        setStatus('success');
        setMessage(response.data.message);
        setUser(response.data.user);
      } catch (error) {
        console.log('Verification error:', error);
        console.log('Error response:', error.response?.data);
        setStatus('error');
        setMessage(error.response?.data?.message || 'Failed to verify email. The token may be invalid or expired.');
      }
    };

    verifyEmail();
  }, [token]);

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
      setResendMessage(error.response?.data?.message || 'Failed to resend verification email. Please try again later.');
    }
  };

  return (
    <div className="email-verification-page">
      <div className="verification-container">
        <h1>Email Verification</h1>

        {status === 'loading' && (
          <div className="verification-status loading">
            <div className="spinner"></div>
            <p>Verifying your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="verification-status success">
            <div className="success-icon">✓</div>
            <h2>Email Verified!</h2>
            <p>{message}</p>
            {user && (
              <div className="user-info">
                <p>Username: {user.username}</p>
                <p>Email: {user.email}</p>
              </div>
            )}
            <div className="action-buttons">
              <Link to="/login" className="btn btn-primary">Login</Link>
              <Link to="/" className="btn btn-secondary">Go to Homepage</Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="verification-status error">
            <div className="error-icon">✗</div>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <div className="resend-section">
              <p>Need a new verification email?</p>

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
                  <button 
                    onClick={handleResendVerification} 
                    className="btn btn-primary"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
            <div className="action-buttons">
              <Link to="/login" className="btn btn-secondary">Back to Login</Link>
              <Link to="/" className="btn btn-secondary">Go to Homepage</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
