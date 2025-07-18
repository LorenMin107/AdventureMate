import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import TwoFactorVerification from './TwoFactorVerification';
import GoogleOAuthButton from './GoogleOAuthButton';
import { logError } from '../utils/logger';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import CSSIsolationWrapper from './CSSIsolationWrapper';
import { useTranslation } from 'react-i18next';
import './LoginForm.css';

/**
 * Login form component
 * Allows users to log in to the application
 */
const LoginForm = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState('');
  const {
    login,
    error,
    loading,
    requiresTwoFactor,
    clearLoginAttempt,
    currentUser,
    logout,
    isAuthenticated,
  } = useAuth();
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

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is already authenticated, redirecting to home');
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    console.log('🔍 LoginForm: handleSubmit called');
    e.preventDefault();
    console.log('🔍 LoginForm: preventDefault called');
    setFormError('');

    // Validate form
    if (!email.trim()) {
      console.log('🔍 LoginForm: Email validation failed');
      setFormError(t('auth.emailRequired'));
      return;
    }

    if (!password) {
      console.log('🔍 LoginForm: Password validation failed');
      setFormError(t('auth.passwordRequired'));
      return;
    }

    console.log('🔍 LoginForm: Starting login attempt');
    try {
      const result = await login(email, password, rememberMe);
      console.log('🔍 LoginForm: Login result:', result);

      // Check if login failed (returned null)
      if (result === null) {
        console.log('🔍 LoginForm: Login failed, showing error message');
        // Error is already set in AuthContext, just add to flash messages
        addErrorMessage(error || t('auth.loginFailed'));
        return;
      }

      // Check if 2FA is required
      if (result && result.requiresTwoFactor) {
        console.log('🔍 LoginForm: 2FA required');
        // The requiresTwoFactor state in AuthContext will trigger the 2FA verification UI
        return;
      }

      console.log('🔍 LoginForm: Login successful, navigating to home');
      addSuccessMessage(t('auth.loginSuccessful'));
      navigate('/'); // Redirect to home page after successful login
    } catch (err) {
      console.log('🔍 LoginForm: Login error caught:', err);
      // Extract error message from the error object
      let errorMessage = t('auth.loginFailed');

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
    setEmail('');
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
    <CSSIsolationWrapper section="common" className="login-form-container">
      <div className="common-form-logo">
        <span className="common-logo-text">AdventureMate</span>
      </div>

      <h2>{t('auth.loginTitle')}</h2>

      {(formError || error) && <div className="common-error-message">{formError || error}</div>}

      <form onSubmit={handleSubmit} className="common-login-form">
        <div className="common-form-group">
          <label htmlFor="email">{t('auth.email')}</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder={t('auth.email')}
          />
        </div>

        <div className="common-form-group">
          <label htmlFor="password">{t('auth.password')}</label>
          <div className="common-password-input-container">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
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
          <div className="common-forgot-password-link">
            <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
          </div>
        </div>

        <div className="common-form-group common-checkbox-group">
          <label className="common-checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
            />
            <span>{t('auth.rememberMeFor30Days')}</span>
          </label>
        </div>

        <button type="submit" className="common-btn common-btn-primary" disabled={loading}>
          {loading ? t('auth.loggingIn') : t('auth.continue')}
        </button>
      </form>

      {/* Divider */}
      <div className="login-form-divider">
        <span className="login-form-divider-text">{t('auth.or') || 'or'}</span>
      </div>

      {/* Google OAuth Button */}
      <GoogleOAuthButton
        onSuccess={(user) => {
          addSuccessMessage(t('auth.googleLoginSuccess') || 'Successfully logged in with Google!');
          navigate('/');
        }}
        onError={(error) => {
          addErrorMessage(error);
        }}
        disabled={loading}
      />

      <div className="common-form-footer">
        <p>
          {t('auth.dontHaveAccount')} <Link to="/register">{t('auth.signUp')}</Link>
        </p>
      </div>
    </CSSIsolationWrapper>
  );
};

export default LoginForm;
