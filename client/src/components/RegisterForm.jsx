import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import { logError } from '../utils/logger';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import CSSIsolationWrapper from './CSSIsolationWrapper';
import { useTranslation } from 'react-i18next';
import './RegisterForm.css';
import apiClient from '../utils/api';

/**
 * Registration form component
 * Allows users to create a new account
 */
const RegisterForm = () => {
  const { t } = useTranslation();
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
        message = t('auth.passwordStrength.tooWeak');
        color = '#dc3545'; // red
        break;
      case 2:
        message = t('auth.passwordStrength.weak');
        color = '#ffc107'; // yellow
        break;
      case 3:
        message = t('auth.passwordStrength.moderate');
        color = '#fd7e14'; // orange
        break;
      case 4:
        message = t('auth.passwordStrength.strong');
        color = '#28a745'; // green
        break;
      case 5:
        message = t('auth.passwordStrength.veryStrong');
        color = '#20c997'; // teal
        break;
      default:
        message = t('auth.passwordStrength.tooWeak');
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
      setFormError(t('auth.usernameRequired'));
      return false;
    }

    // Email validation
    if (!formData.email.trim()) {
      setFormError(t('auth.emailRequired'));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError(t('auth.emailInvalid'));
      return false;
    }

    // Password validation
    if (!formData.password) {
      setFormError(t('auth.passwordRequired'));
      return false;
    }

    if (passwordStrength.score < 3) {
      setFormError(t('auth.passwordTooWeak'));
      return false;
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      setFormError(t('auth.passwordMismatch'));
      return false;
    }

    // Phone validation
    if (!formData.phone.trim()) {
      setFormError(t('auth.phoneRequired'));
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
        addErrorMessage(error || t('auth.registrationFailed'));
        return;
      }

      // Check if email is verified
      if (user && !user.isEmailVerified) {
        // Redirect to email verification page with a message
        addSuccessMessage(t('auth.registrationSuccessful'));
        navigate('/verify-email-required');
      } else {
        // This case is unlikely but handled for completeness
        addSuccessMessage(t('auth.registrationWelcome'));
        navigate('/');
      }
    } catch (err) {
      // Extract error message from the error object
      let errorMessage = t('auth.registrationFailed');

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
      <CSSIsolationWrapper section="common" className="register-container">
        {inviteError ? (
          <div className="common-form-error">{inviteError}</div>
        ) : inviteTripId ? (
          <div className="common-form-success">{t('auth.invite.alreadyLoggedIn')}</div>
        ) : (
          <div className="common-form-success">{t('auth.invite.checkingInvite')}</div>
        )}
      </CSSIsolationWrapper>
    );
  }

  return (
    <CSSIsolationWrapper section="common" className="register-form-container">
      <div className="common-form-logo">
        <span className="common-logo-text">AdventureMate</span>
      </div>

      <h2>{t('auth.registerTitle')}</h2>

      {(formError || error) && <div className="common-error-message">{formError || error}</div>}

      <form onSubmit={handleSubmit} className="common-register-form">
        <div className="common-form-group">
          <label htmlFor="username">{t('auth.username')}</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
            required
            placeholder={t('auth.username')}
          />
        </div>

        <div className="common-form-group">
          <label htmlFor="email">{t('auth.email')}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            required
            placeholder={t('auth.email')}
          />
        </div>

        <div className="common-form-group">
          <label htmlFor="phone">{t('common.phone')}</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
            required
            placeholder={t('common.phone')}
          />
        </div>

        <div className="common-form-group">
          <label htmlFor="password">{t('auth.password')}</label>
          <div className="common-password-input-container">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
              placeholder={t('auth.password')}
              className="common-password-input"
            />
            <button
              type="button"
              className="common-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {formData.password && (
            <div className="common-password-strength">
              <div className="common-password-strength-bar">
                <div
                  className="common-password-strength-progress"
                  style={{
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    backgroundColor: passwordStrength.color,
                  }}
                ></div>
              </div>
              <div
                className="common-password-strength-text"
                style={{ color: passwordStrength.color }}
              >
                {passwordStrength.message}
              </div>
            </div>
          )}

          <div className="common-password-requirements">
            <p>{t('auth.passwordMust')}</p>
            <ul>
              <li className={formData.password.length >= 8 ? 'met' : ''}>
                {t('auth.passwordRequirements.minLength')}
              </li>
              <li className={/[A-Z]/.test(formData.password) ? 'met' : ''}>
                {t('auth.passwordRequirements.uppercase')}
              </li>
              <li className={/[a-z]/.test(formData.password) ? 'met' : ''}>
                {t('auth.passwordRequirements.lowercase')}
              </li>
              <li className={/\d/.test(formData.password) ? 'met' : ''}>
                {t('auth.passwordRequirements.number')}
              </li>
              <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'met' : ''}>
                {t('auth.passwordRequirements.special')}
              </li>
            </ul>
          </div>
        </div>

        <div className="common-form-group">
          <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
          <div className="common-password-input-container">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              required
              placeholder={t('auth.confirmPassword')}
              className="common-password-input"
            />
            <button
              type="button"
              className="common-password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="common-btn common-btn-primary"
          disabled={loading || (formData.password && passwordStrength.score < 3)}
        >
          {loading ? t('auth.creatingAccount') : t('auth.signUp')}
        </button>
      </form>

      <div className="common-form-footer">
        <p>
          {t('auth.alreadyHaveAccount')} <Link to="/login">{t('auth.logIn')}</Link>
        </p>
      </div>
    </CSSIsolationWrapper>
  );
};

export default RegisterForm;
