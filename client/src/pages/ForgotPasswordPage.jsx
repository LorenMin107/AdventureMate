import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ForgotPasswordPage.css';

/**
 * ForgotPasswordPage component
 * Allows users to request a password reset by entering their email address
 */
const ForgotPasswordPage = () => {
  const { requestPasswordReset, loading: authLoading, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState('');

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError('');
    setStatus('loading');
    setMessage('');

    try {
      // Use the requestPasswordReset method from AuthContext
      const responseMessage = await requestPasswordReset(email);
      setStatus('success');
      setMessage(responseMessage || 'If your email is registered, you will receive a password reset link shortly.');
    } catch (error) {
      console.error('Error requesting password reset:', error);
      setStatus('error');
      // For security reasons, don't reveal if the email exists or not
      setMessage('If your email is registered, you will receive a password reset link shortly.');
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <h1>Forgot Password</h1>

        {status === 'idle' && (
          <div className="forgot-password-form-container">
            <p>Enter your email address below and we'll send you a link to reset your password.</p>

            <form onSubmit={handleSubmit} className="forgot-password-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={emailError ? 'input-error' : ''}
                />
                {emailError && <div className="error-message">{emailError}</div>}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={status === 'loading' || authLoading}
              >
                {status === 'loading' || authLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="forgot-password-links">
              <Link to="/login">Back to Login</Link>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="forgot-password-status loading">
            <div className="spinner"></div>
            <p>Sending password reset link...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="forgot-password-status success">
            <div className="success-icon">✓</div>
            <h2>Check Your Email</h2>
            <p>{message}</p>
            <p>Please check your email inbox and spam folder for the password reset link.</p>
            <div className="action-buttons">
              <Link to="/login" className="btn btn-primary">Back to Login</Link>
              <Link to="/" className="btn btn-secondary">Go to Homepage</Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="forgot-password-status error">
            <div className="error-icon">✗</div>
            <h2>Something Went Wrong</h2>
            <p>{message}</p>
            <div className="action-buttons">
              <button 
                onClick={() => setStatus('idle')} 
                className="btn btn-primary"
              >
                Try Again
              </button>
              <Link to="/login" className="btn btn-secondary">Back to Login</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
