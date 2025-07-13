import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import { logError } from '../utils/logger';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './RegisterForm.css';
import apiClient from '../utils/api';

/**
 * Registration form component
 * Allows users to create a new account
 */
const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: 'Password is too weak',
    color: '#dc3545',
  });
  const { register, error, loading, clearLoginAttempt } = useAuth();
  const { addSuccessMessage, addErrorMessage } = useFlashMessage();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteToken = searchParams.get('invite');
  const { currentUser, isAuthenticated } = useAuth();
  const [inviteTripId, setInviteTripId] = useState(null);
  const [inviteError, setInviteError] = useState('');

  // Clear login attempt flag when component unmounts
  useEffect(() => {
    return () => {
      // Clear the login attempt flag when leaving the register form
      if (clearLoginAttempt) {
        clearLoginAttempt();
      }
    };
  }, [clearLoginAttempt]);

  // If already logged in and there is an invite token, fetch invite and redirect
  useEffect(() => {
    if (isAuthenticated && inviteToken) {
      // Fetch invite info from backend
      apiClient
        .get(`/trips/invite-by-token/${inviteToken}`)
        .then((res) => {
          const tripId = res.data.tripId;
          setInviteTripId(tripId);
          // Redirect after short delay
          setTimeout(() => {
            navigate(`/trips/${tripId}`);
          }, 2000);
        })
        .catch(() => {
          setInviteError('This invite is invalid or has expired.');
        });
    }
  }, [isAuthenticated, inviteToken, navigate]);

  // Check password strength
  useEffect(() => {
    if (!formData.password) {
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
    if (formData.password.length >= 8) score += 1;

    // Uppercase check
    if (/[A-Z]/.test(formData.password)) score += 1;

    // Lowercase check
    if (/[a-z]/.test(formData.password)) score += 1;

    // Number check
    if (/\d/.test(formData.password)) score += 1;

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) score += 1;

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
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    // Username validation
    if (!formData.username.trim()) {
      setFormError('Username is required');
      return false;
    }

    // Email validation
    if (!formData.email.trim()) {
      setFormError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address');
      return false;
    }

    // Password validation
    if (!formData.password) {
      setFormError('Password is required');
      return false;
    }

    if (passwordStrength.score < 3) {
      setFormError('Please choose a stronger password');
      return false;
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }

    // Phone validation
    if (!formData.phone.trim()) {
      setFormError('Phone number is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validateForm()) {
      return;
    }

    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = formData;
      // If inviteToken is present, include it in the registration payload
      if (inviteToken) {
        userData.invite = inviteToken;
      }
      const user = await register(userData);

      // Check if registration failed (returned null)
      if (user === null) {
        // Error is already set in AuthContext, just add to flash messages
        addErrorMessage(error || 'Registration failed. Please try again.');
        return;
      }

      // Check if email is verified
      if (user && !user.isEmailVerified) {
        // Redirect to email verification page with a message
        addSuccessMessage(
          'Registration successful! Please check your email to verify your account.'
        );
        navigate('/verify-email-required');
      } else {
        // This case is unlikely but handled for completeness
        addSuccessMessage('Registration successful! Welcome to AdventureMate.');
        navigate('/');
      }
    } catch (err) {
      // Extract error message from the error object
      let errorMessage = 'Registration failed. Please try again.';

      if (err.response && err.response.data) {
        // API error response
        errorMessage = err.response.data.message || err.response.data.error || errorMessage;
      } else if (err.message) {
        // JavaScript error
        errorMessage = err.message;
      }

      // Set form error for immediate display
      setFormError(errorMessage);

      // Also add to flash messages for consistency
      addErrorMessage(errorMessage);

      logError('Registration error', err);
    }
  };

  if (isAuthenticated && inviteToken) {
    return (
      <div className="register-container">
        {inviteError ? (
          <div className="form-error">{inviteError}</div>
        ) : inviteTripId ? (
          <div className="form-success">
            You are already logged in. Redirecting you to the trip...
          </div>
        ) : (
          <div className="form-success">Checking your invite...</div>
        )}
      </div>
    );
  }

  return (
    <div className="register-form-container">
      <div className="form-logo">
        <span className="logo-text">AdventureMate</span>
      </div>

      <h2>Sign up for AdventureMate</h2>

      {(formError || error) && <div className="error-message">{formError || error}</div>}

      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
            required
            placeholder="Choose a username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            required
            placeholder="Enter your email address"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
            required
            placeholder="Enter your phone number"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-input-container">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
              placeholder="Create a password"
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

          {formData.password && (
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
              <div className="password-strength-text" style={{ color: passwordStrength.color }}>
                {passwordStrength.message}
              </div>
            </div>
          )}

          <div className="password-requirements">
            <p>Password must:</p>
            <ul>
              <li className={formData.password.length >= 8 ? 'met' : ''}>
                Be at least 8 characters long
              </li>
              <li className={/[A-Z]/.test(formData.password) ? 'met' : ''}>
                Include at least one uppercase letter
              </li>
              <li className={/[a-z]/.test(formData.password) ? 'met' : ''}>
                Include at least one lowercase letter
              </li>
              <li className={/\d/.test(formData.password) ? 'met' : ''}>
                Include at least one number
              </li>
              <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'met' : ''}>
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
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              required
              placeholder="Confirm your password"
              className="password-input"
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
        </div>

        <button
          type="submit"
          className="register-button"
          disabled={loading || (formData.password && passwordStrength.score < 3)}
        >
          {loading ? 'Creating Account...' : 'Sign up'}
        </button>
      </form>

      <div className="form-footer">
        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
