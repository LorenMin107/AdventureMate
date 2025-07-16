import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import { FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import { logError } from '../utils/logger';
import './PasswordChangeForm.css';

/**
 * PasswordChangeForm component
 * Allows authenticated users to change their password
 */
const PasswordChangeForm = () => {
  const { t } = useTranslation();
  const { changePassword, loading, currentUser } = useAuth();
  const { userDetails } = useUser();
  const { showMessage } = useFlashMessage();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorCode: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: 'Password is too weak',
    color: '#dc3545',
  });

  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [showTwoFactorInput, setShowTwoFactorInput] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check if user has 2FA enabled
  useEffect(() => {
    // Use userDetails from UserContext if available, otherwise fall back to currentUser
    const user = userDetails || currentUser;

    if (user?.isTwoFactorEnabled) {
      setShowTwoFactorInput(true);
    } else {
      setShowTwoFactorInput(false);
      // Clear 2FA code when 2FA is disabled
      setFormData((prev) => ({
        ...prev,
        twoFactorCode: '',
      }));
    }
  }, [currentUser, userDetails]);

  // Check password strength
  const checkPasswordStrength = (password) => {
    let score = 0;
    let message = t('passwordChange.tooWeak');
    let color = '#dc3545';

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score >= 4) {
      message = t('passwordChange.strong');
      color = '#28a745';
    } else if (score >= 3) {
      message = t('passwordChange.good');
      color = '#ffc107';
    } else if (score >= 2) {
      message = t('passwordChange.fair');
      color = '#fd7e14';
    }

    return { score, message, color };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    // Check password strength for new password
    if (name === 'newPassword') {
      setPasswordStrength(checkPasswordStrength(value));
    }

    // Clear success state when user starts typing again
    if (success) {
      setSuccess(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = t('passwordChange.currentPasswordRequired');
    }

    if (!formData.newPassword) {
      newErrors.newPassword = t('passwordChange.newPasswordRequired');
    } else if (passwordStrength.score < 3) {
      newErrors.newPassword = t('passwordChange.chooseStrongerPassword');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordChange.confirmPasswordRequired');
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordChange.passwordsDoNotMatch');
    }

    // Validate 2FA code if required
    if (showTwoFactorInput && !formData.twoFactorCode) {
      newErrors.twoFactorCode = t('passwordChange.twoFactorCodeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const twoFactorCode = showTwoFactorInput ? formData.twoFactorCode : null;
      const message = await changePassword(
        formData.currentPassword,
        formData.newPassword,
        twoFactorCode
      );

      // Show success message
      showMessage(message || t('passwordChange.successMessage'), 'success');

      // Set success state
      setSuccess(true);

      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorCode: '',
      });
      setPasswordStrength({
        score: 0,
        message: t('passwordChange.tooWeak'),
        color: '#dc3545',
      });
      setRequiresTwoFactor(false);

      // Clear success state after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (error) {
      logError('Error changing password', error);

      // Handle 2FA requirement
      if (error.response?.data?.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setShowTwoFactorInput(true);
        showMessage(t('passwordChange.twoFactorCodeRequired'), 'error');
      } else {
        showMessage(error.message || t('passwordChange.failedToChange'), 'error');
      }
    }
  };

  // If success, show success message
  if (success) {
    return (
      <div className="profile-card">
        <div className="form-header">
          <div className="success-indicator">
            <FiCheckCircle className="success-icon" />
            <h3>{t('passwordChange.changedSuccessfully')}</h3>
          </div>
          <p>{t('passwordChange.passwordUpdated')}</p>
        </div>
        <div className="success-actions">
          <button onClick={() => setSuccess(false)} className="submit-button">
            {t('passwordChange.changeAnotherPassword')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-card">
      <div className="form-header">
        <h3>{t('passwordChange.changePassword')}</h3>
        <p>{t('passwordChange.updatePasswordDescription')}</p>
        {showTwoFactorInput && (
          <div className="two-factor-notice">
            <span className="two-factor-icon">🔐</span>
            <span>{t('passwordChange.twoFactorEnabled')}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="password-form">
        <div className="form-group">
          <label htmlFor="currentPassword">{t('passwordChange.currentPassword')}</label>
          <div className="password-input-group">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              className={errors.currentPassword ? 'error' : ''}
              placeholder={t('passwordChange.enterCurrentPassword')}
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('current')}
              disabled={loading}
            >
              {showPasswords.current ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.currentPassword && (
            <span className="error-message">{errors.currentPassword}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">{t('passwordChange.newPassword')}</label>
          <div className="password-input-group">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              className={errors.newPassword ? 'error' : ''}
              placeholder={t('passwordChange.enterNewPassword')}
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('new')}
              disabled={loading}
            >
              {showPasswords.new ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}

          {/* Password strength indicator */}
          {formData.newPassword && (
            <div className="password-strength">
              <div className="strength-bar">
                <div
                  className="strength-fill"
                  style={{
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    backgroundColor: passwordStrength.color,
                  }}
                ></div>
              </div>
              <span className="strength-text" style={{ color: passwordStrength.color }}>
                {passwordStrength.message}
              </span>
            </div>
          )}

          {/* Password requirements */}
          <div className="password-requirements">
            <h4>{t('passwordChange.passwordRequirements')}:</h4>
            <ul>
              <li className={formData.newPassword.length >= 8 ? 'met' : 'unmet'}>
                {t('passwordChange.atLeast8Characters')}
              </li>
              <li className={/[a-z]/.test(formData.newPassword) ? 'met' : 'unmet'}>
                {t('passwordChange.containsLowercase')}
              </li>
              <li className={/[A-Z]/.test(formData.newPassword) ? 'met' : 'unmet'}>
                {t('passwordChange.containsUppercase')}
              </li>
              <li className={/[0-9]/.test(formData.newPassword) ? 'met' : 'unmet'}>
                {t('passwordChange.containsNumber')}
              </li>
              <li className={/[^A-Za-z0-9]/.test(formData.newPassword) ? 'met' : 'unmet'}>
                {t('passwordChange.containsSpecial')}
              </li>
            </ul>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">{t('passwordChange.confirmNewPassword')}</label>
          <div className="password-input-group">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={errors.confirmPassword ? 'error' : ''}
              placeholder={t('passwordChange.confirmNewPasswordPlaceholder')}
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('confirm')}
              disabled={loading}
            >
              {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="error-message">{errors.confirmPassword}</span>
          )}
        </div>

        {/* Two-Factor Authentication Code */}
        {showTwoFactorInput && (
          <div className="form-group">
            <label htmlFor="twoFactorCode">{t('passwordChange.twoFactorCode')}</label>
            <input
              type="text"
              id="twoFactorCode"
              name="twoFactorCode"
              value={formData.twoFactorCode}
              onChange={handleInputChange}
              className={errors.twoFactorCode ? 'error' : ''}
              placeholder={t('passwordChange.enter2FACode')}
              disabled={loading}
              maxLength="6"
              pattern="[0-9]*"
              inputMode="numeric"
            />
            {errors.twoFactorCode && <span className="error-message">{errors.twoFactorCode}</span>}
            <small className="help-text">{t('passwordChange.enter6DigitCode')}</small>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? t('passwordChange.changingPassword') : t('passwordChange.changePassword')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordChangeForm;
