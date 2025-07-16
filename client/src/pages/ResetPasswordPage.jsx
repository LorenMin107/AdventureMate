import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { logError } from '../utils/logger';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './ResetPasswordPage.css';

/**
 * ResetPasswordPage component
 * Allows users to reset their password using a token received via email
 */
const ResetPasswordPage = () => {
  const { resetPassword, loading: authLoading, error: authError } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(token ? 'idle' : 'error'); // idle, loading, success, error
  const [message, setMessage] = useState(token ? '' : t('resetPassword.tokenError'));
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: t('resetPassword.passwordTooWeak'),
    color: '#dc3545',
  });

  // Check password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength({
        score: 0,
        message: t('resetPassword.passwordTooWeak'),
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
        message = t('resetPassword.passwordTooWeak');
        color = '#dc3545'; // red
        break;
      case 2:
        message = t('resetPassword.passwordWeak');
        color = '#ffc107'; // yellow
        break;
      case 3:
        message = t('resetPassword.passwordModerate');
        color = '#fd7e14'; // orange
        break;
      case 4:
        message = t('resetPassword.passwordStrong');
        color = '#28a745'; // green
        break;
      case 5:
        message = t('resetPassword.passwordVeryStrong');
        color = '#20c997'; // teal
        break;
      default:
        message = t('resetPassword.passwordTooWeak');
        color = '#dc3545'; // red
    }

    setPasswordStrength({ score, message, color });
  }, [password, t]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password
    let isValid = true;

    if (!password) {
      setPasswordError(t('resetPassword.passwordRequired'));
      isValid = false;
    } else if (passwordStrength.score < 3) {
      setPasswordError(t('resetPassword.chooseStrongerPassword'));
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (!confirmPassword) {
      setConfirmPasswordError(t('resetPassword.confirmPasswordRequired'));
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(t('resetPassword.passwordsDoNotMatch'));
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
      setMessage(responseMessage || t('resetPassword.passwordResetSuccess'));

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
      setMessage(error.message || t('resetPassword.resetFailed'));
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <h1>{t('resetPassword.title')}</h1>

        {status === 'idle' && (
          <div className="reset-password-form-container">
            <p>{t('resetPassword.enterNewPassword')}</p>

            <form onSubmit={handleSubmit} className="reset-password-form">
              <div className="form-group">
                <label htmlFor="password">{t('resetPassword.newPassword')}</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('resetPassword.enterNewPasswordPlaceholder')}
                    className={`password-input ${passwordError ? 'input-error' : ''}`}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? t('resetPassword.hidePassword')
                        : t('resetPassword.showPassword')
                    }
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
                  <p>{t('resetPassword.passwordMust')}</p>
                  <ul>
                    <li className={password.length >= 8 ? 'met' : ''}>
                      {t('resetPassword.atLeast8Characters')}
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'met' : ''}>
                      {t('resetPassword.includeUppercase')}
                    </li>
                    <li className={/[a-z]/.test(password) ? 'met' : ''}>
                      {t('resetPassword.includeLowercase')}
                    </li>
                    <li className={/\d/.test(password) ? 'met' : ''}>
                      {t('resetPassword.includeNumber')}
                    </li>
                    <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'met' : ''}>
                      {t('resetPassword.includeSpecial')}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">{t('resetPassword.confirmPassword')}</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                    className={`password-input ${confirmPasswordError ? 'input-error' : ''}`}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword
                        ? t('resetPassword.hidePassword')
                        : t('resetPassword.showPassword')
                    }
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
                {status === 'loading' || authLoading
                  ? t('resetPassword.resetting')
                  : t('resetPassword.resetPassword')}
              </button>
            </form>
          </div>
        )}

        {status === 'loading' && (
          <div className="reset-password-status loading">
            <div className="spinner"></div>
            <p>{t('resetPassword.resettingPassword')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="reset-password-status success">
            <div className="success-icon">✓</div>
            <h2>{t('resetPassword.passwordResetSuccessful')}</h2>
            <p>{message}</p>
            <p>{t('resetPassword.redirectToLogin')}</p>
            <div className="action-buttons">
              <Link to="/login" className="btn btn-primary">
                {t('resetPassword.loginNow')}
              </Link>
              <Link to="/" className="btn btn-secondary">
                {t('resetPassword.goToHomepage')}
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="reset-password-status error">
            <div className="error-icon">✗</div>
            <h2>{t('resetPassword.passwordResetFailed')}</h2>
            <p>{message}</p>
            <div className="action-buttons">
              <Link to="/forgot-password" className="btn btn-primary">
                {t('resetPassword.requestNewResetLink')}
              </Link>
              <Link to="/login" className="btn btn-secondary">
                {t('resetPassword.backToLogin')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
