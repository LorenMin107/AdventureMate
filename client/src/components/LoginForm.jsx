import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import TwoFactorVerification from './TwoFactorVerification';
import { logError } from '../utils/logger';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './LoginForm.css';

/**
 * Login form component
 * Allows users to log in to the application
 */
const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState('');
  const { login, error, loading, requiresTwoFactor, clearLoginAttempt, currentUser, logout } =
    useAuth();
  const { addSuccessMessage, addErrorMessage } = useFlashMessage();
  const navigate = useNavigate();

  // Clear login attempt flag when component unmounts
  useEffect(() => {
    return () => {
      // Clear the login attempt flag when leaving the login form
      if (clearLoginAttempt) {
        clearLoginAttempt();
      }
    };
  }, [clearLoginAttempt]);

  const handleSubmit = async (e) => {
    console.log('🔍 LoginForm: handleSubmit called');
    e.preventDefault();
    console.log('🔍 LoginForm: preventDefault called');
    setFormError('');

    // Validate form
    if (!username.trim()) {
      console.log('🔍 LoginForm: Username validation failed');
      setFormError('Username is required');
      return;
    }

    if (!password) {
      console.log('🔍 LoginForm: Password validation failed');
      setFormError('Password is required');
      return;
    }

    console.log('🔍 LoginForm: Starting login attempt');
    try {
      const result = await login(username, password, rememberMe);
      console.log('🔍 LoginForm: Login result:', result);

      // Check if login failed (returned null)
      if (result === null) {
        console.log('🔍 LoginForm: Login failed, showing error message');
        // Error is already set in AuthContext, just add to flash messages
        addErrorMessage(error || 'Login failed. Please try again.');
        return;
      }

      // Check if 2FA is required
      if (result && result.requiresTwoFactor) {
        console.log('🔍 LoginForm: 2FA required');
        // The requiresTwoFactor state in AuthContext will trigger the 2FA verification UI
        return;
      }

      console.log('🔍 LoginForm: Login successful, navigating to home');
      addSuccessMessage('Login successful! Welcome back.');
      navigate('/'); // Redirect to home page after successful login
    } catch (err) {
      console.log('🔍 LoginForm: Login error caught:', err);
      // Extract error message from the error object
      let errorMessage = 'Login failed. Please try again.';

      if (err.response && err.response.data) {
        // API error response
        errorMessage = err.response.data.message || err.response.data.error || errorMessage;
      } else if (err.message) {
        // JavaScript error
        errorMessage = err.message;
      }

      console.log('🔍 LoginForm: Setting error message:', errorMessage);
      // Set form error for immediate display
      setFormError(errorMessage);

      // Also add to flash messages for consistency
      addErrorMessage(errorMessage);

      logError('Login error', err);
    }
  };

  // Handle cancellation of 2FA verification
  const handleCancelTwoFactor = () => {
    setUsername('');
    setPassword('');
    setRememberMe(false);
    // Clear the 2FA state by calling logout to reset auth state
    // This will clear currentUser and requiresTwoFactor
    logout();
  };

  // If 2FA verification is required, show the 2FA verification component
  if (requiresTwoFactor && currentUser) {
    return <TwoFactorVerification userId={currentUser._id} onCancel={handleCancelTwoFactor} />;
  }

  // Otherwise, show the login form
  return (
    <div className="login-form-container">
      <div className="form-logo">
        <span className="logo-text">AdventureMate</span>
      </div>

      <h2>Log in to your account</h2>

      {(formError || error) && <div className="error-message">{formError || error}</div>}

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            placeholder="Enter your username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-input-container">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="Enter your password"
              className="password-input"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <div className="forgot-password-link">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
            />
            <span>Remember me for 30 days</span>
          </label>
        </div>

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Continue'}
        </button>
      </form>

      <div className="form-footer">
        <p>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
