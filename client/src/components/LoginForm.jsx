import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import TwoFactorVerification from './TwoFactorVerification';
import './LoginForm.css';

/**
 * Login form component
 * Allows users to log in to the application
 */
const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState('');
  const [userId, setUserId] = useState(null);
  const { login, error, loading, requiresTwoFactor } = useAuth();
  const { addSuccessMessage, addErrorMessage } = useFlashMessage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate form
    if (!username.trim()) {
      setFormError('Username is required');
      return;
    }

    if (!password) {
      setFormError('Password is required');
      return;
    }

    try {
      const result = await login(username, password, rememberMe);

      // Check if 2FA is required
      if (result && result.requiresTwoFactor) {
        setUserId(result.userId);
        // The requiresTwoFactor state in AuthContext will trigger the 2FA verification UI
        return;
      }

      addSuccessMessage('Login successful! Welcome back.');
      navigate('/'); // Redirect to home page after successful login
    } catch (err) {
      // Error is already handled by the AuthContext
      console.error('Login error:', err);
      addErrorMessage(err.message || 'Login failed. Please try again.');
    }
  };

  // Handle cancellation of 2FA verification
  const handleCancelTwoFactor = () => {
    setUserId(null);
    setUsername('');
    setPassword('');
    setRememberMe(false);
  };

  // If 2FA verification is required, show the 2FA verification component
  if (requiresTwoFactor && userId) {
    return <TwoFactorVerification userId={userId} onCancel={handleCancelTwoFactor} />;
  }

  // Otherwise, show the login form
  return (
    <div className="login-form-container">
      <div className="form-logo">
        <span className="logo-text">MyanCamp</span>
      </div>

      <h2>Log in to your account</h2>

      {(formError || error) && (
        <div className="error-message">
          {formError || error}
        </div>
      )}

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
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            placeholder="Enter your password"
          />
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
