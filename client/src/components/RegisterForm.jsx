import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import { logError } from '../utils/logger';
import './RegisterForm.css';

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
  const [formError, setFormError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: 'Password is too weak',
    color: '#dc3545',
  });
  const { register, error, loading } = useAuth();
  const { addSuccessMessage, addErrorMessage } = useFlashMessage();
  const navigate = useNavigate();

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
      const user = await register(userData);

      // Check if email is verified
      if (user && !user.isEmailVerified) {
        // Redirect to email verification page with a message
        addSuccessMessage(
          'Registration successful! Please check your email to verify your account.'
        );
        navigate('/verify-email-required');
      } else {
        // This case is unlikely but handled for completeness
        addSuccessMessage('Registration successful! Welcome to MyanCamp.');
        navigate('/');
      }
    } catch (err) {
      // Error is already handled by the AuthContext
      logError('Registration error', err);
      addErrorMessage(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="register-form-container">
      <div className="form-logo">
        <span className="logo-text">MyanCamp</span>
      </div>

      <h2>Sign up for MyanCamp</h2>

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
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            required
            placeholder="Create a password"
          />

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
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            required
            placeholder="Confirm your password"
          />
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
