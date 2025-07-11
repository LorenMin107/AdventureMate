import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logError } from '../utils/logger';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './ResetPasswordPage.css';

/**
 * ResetPasswordPage component
 * Allows users to reset their password using a token received via email
 */
const ResetPasswordPage = () => {
  const { resetPassword, loading: authLoading, error: authError } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(token ? 'idle' : 'error'); // idle, loading, success, error
  const [message, setMessage] = useState(
    token ? '' : 'No reset token provided. Please check your email link.'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: 'Password is too weak',
    color: '#dc3545',
  });

  // Check password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength({
        score: 0,
        message: 'Password is too weak',
        color: '#dc3545',
      });
      return;
    }

    // Check password strength
    let score = 0;
    let message = '';
    let color = '';

    // Length check
    if (password.length >= 8) score += 1;

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;

    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;

    // Number check
    if (/\d/.test(password)) score += 1;

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

    // Set message and color based on score
    switch (score) {
      case 0:
      case 1:
        message = 'Password is too weak';
        color = '#dc3545'; // red
        break;
      case 2:
        message = 'Password is weak';
        color = '#ffc107'; // yellow
        break;
      case 3:
        message = 'Password is moderate';
        color = '#fd7e14'; // orange
        break;
      case 4:
        message = 'Password is strong';
        color = '#28a745'; // green
        break;
      case 5:
        message = 'Password is very strong';
        color = '#20c997'; // teal
        break;
      default:
        message = 'Password is too weak';
        color = '#dc3545'; // red
    }

    setPasswordStrength({ score, message, color });
  }, [password]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password
    let isValid = true;

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (passwordStrength.score < 3) {
      setPasswordError('Please choose a stronger password');
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    if (!isValid) return;

    setStatus('loading');
    setMessage('');

    try {
      // Use the resetPassword method from AuthContext
      const responseMessage = await resetPassword(token, password);
      setStatus('success');
      setMessage(responseMessage || 'Your password has been reset successfully.');

      // Clear form
      setPassword('');
      setConfirmPassword('');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      logError('Error resetting password', error);
      setStatus('error');
      setMessage(error.message || 'Failed to reset password. The token may be invalid or expired.');
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <h1>Reset Password</h1>

        {status === 'idle' && (
          <div className="reset-password-form-container">
            <p>Enter your new password below.</p>

            <form onSubmit={handleSubmit} className="reset-password-form">
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your new password"
                    className={`password-input ${passwordError ? 'input-error' : ''}`}
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
                {passwordError && <div className="error-message">{passwordError}</div>}

                {/* Password strength indicator */}
                {password && (
                  <div className="password-strength">
                    <div className="password-strength-bar">
                      <div
                        className="password-strength-progress"
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        }}
                      ></div>
                    </div>
                    <div
                      className="password-strength-text"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.message}
                    </div>
                  </div>
                )}

                <div className="password-requirements">
                  <p>Password must:</p>
                  <ul>
                    <li className={password.length >= 8 ? 'met' : ''}>
                      Be at least 8 characters long
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'met' : ''}>
                      Include at least one uppercase letter
                    </li>
                    <li className={/[a-z]/.test(password) ? 'met' : ''}>
                      Include at least one lowercase letter
                    </li>
                    <li className={/\d/.test(password) ? 'met' : ''}>
                      Include at least one number
                    </li>
                    <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'met' : ''}>
                      Include at least one special character
                    </li>
                  </ul>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className={`password-input ${confirmPasswordError ? 'input-error' : ''}`}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {confirmPasswordError && (
                  <div className="error-message">{confirmPasswordError}</div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={status === 'loading' || authLoading || passwordStrength.score < 3}
              >
                {status === 'loading' || authLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        )}

        {status === 'loading' && (
          <div className="reset-password-status loading">
            <div className="spinner"></div>
            <p>Resetting your password...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="reset-password-status success">
            <div className="success-icon">✓</div>
            <h2>Password Reset Successful</h2>
            <p>{message}</p>
            <p>You will be redirected to the login page in a few seconds.</p>
            <div className="action-buttons">
              <Link to="/login" className="btn btn-primary">
                Login Now
              </Link>
              <Link to="/" className="btn btn-secondary">
                Go to Homepage
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="reset-password-status error">
            <div className="error-icon">✗</div>
            <h2>Password Reset Failed</h2>
            <p>{message}</p>
            <div className="action-buttons">
              <Link to="/forgot-password" className="btn btn-primary">
                Request New Reset Link
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
