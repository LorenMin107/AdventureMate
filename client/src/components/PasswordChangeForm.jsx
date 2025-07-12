import { useState, useEffect } from 'react';
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
    let message = 'Password is too weak';
    let color = '#dc3545';

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score >= 4) {
      message = 'Strong password';
      color = '#28a745';
    } else if (score >= 3) {
      message = 'Good password';
      color = '#ffc107';
    } else if (score >= 2) {
      message = 'Fair password';
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
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordStrength.score < 3) {
      newErrors.newPassword = 'Please choose a stronger password';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Validate 2FA code if required
    if (showTwoFactorInput && !formData.twoFactorCode) {
      newErrors.twoFactorCode = 'Two-factor authentication code is required';
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
      showMessage(message || 'Password changed successfully!', 'success');

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
        message: 'Password is too weak',
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
        showMessage('Two-factor authentication code is required', 'error');
      } else {
        showMessage(error.message || 'Failed to change password', 'error');
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
            <h3>Password Changed Successfully!</h3>
          </div>
          <p>Your password has been updated. You can now use your new password to log in.</p>
        </div>
        <div className="success-actions">
          <button onClick={() => setSuccess(false)} className="submit-button">
            Change Another Password
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-card">
      <div className="form-header">
        <h3>Change Password</h3>
        <p>Update your password to keep your account secure</p>
        {showTwoFactorInput && (
          <div className="two-factor-notice">
            <span className="two-factor-icon">🔐</span>
            <span>Two-factor authentication is enabled. You'll need to enter your 2FA code.</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="password-form">
        <div className="form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <div className="password-input-group">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              className={errors.currentPassword ? 'error' : ''}
              placeholder="Enter your current password"
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
          <label htmlFor="newPassword">New Password</label>
          <div className="password-input-group">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              className={errors.newPassword ? 'error' : ''}
              placeholder="Enter your new password"
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
            <h4>Password Requirements:</h4>
            <ul>
              <li className={formData.newPassword.length >= 8 ? 'met' : 'unmet'}>
                At least 8 characters long
              </li>
              <li className={/[a-z]/.test(formData.newPassword) ? 'met' : 'unmet'}>
                Contains lowercase letter
              </li>
              <li className={/[A-Z]/.test(formData.newPassword) ? 'met' : 'unmet'}>
                Contains uppercase letter
              </li>
              <li className={/[0-9]/.test(formData.newPassword) ? 'met' : 'unmet'}>
                Contains number
              </li>
              <li className={/[^A-Za-z0-9]/.test(formData.newPassword) ? 'met' : 'unmet'}>
                Contains special character
              </li>
            </ul>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <div className="password-input-group">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={errors.confirmPassword ? 'error' : ''}
              placeholder="Confirm your new password"
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
            <label htmlFor="twoFactorCode">Two-Factor Authentication Code</label>
            <input
              type="text"
              id="twoFactorCode"
              name="twoFactorCode"
              value={formData.twoFactorCode}
              onChange={handleInputChange}
              className={errors.twoFactorCode ? 'error' : ''}
              placeholder="Enter your 2FA code"
              disabled={loading}
              maxLength="6"
              pattern="[0-9]*"
              inputMode="numeric"
            />
            {errors.twoFactorCode && <span className="error-message">{errors.twoFactorCode}</span>}
            <small className="help-text">Enter the 6-digit code from your authenticator app</small>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordChangeForm;
