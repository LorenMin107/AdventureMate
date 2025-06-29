import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import './TwoFactorVerification.css';

/**
 * Two-factor authentication verification component
 * Allows users to enter a TOTP code or backup code to complete login
 */
const TwoFactorVerification = ({ userId, onCancel }) => {
  const [token, setToken] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [formError, setFormError] = useState('');
  const { verifyTwoFactor, error, loading } = useAuth();
  const { addSuccessMessage, addErrorMessage } = useFlashMessage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate form
    if (!token.trim()) {
      setFormError(useBackupCode ? 'Backup code is required' : 'Verification code is required');
      return;
    }

    try {
      await verifyTwoFactor(token, useBackupCode);
      addSuccessMessage('Two-factor authentication successful! Welcome back.');
      navigate('/'); // Redirect to home page after successful login
    } catch (err) {
      console.error('2FA verification error:', err);
      addErrorMessage(err.message || 'Verification failed. Please try again.');
    }
  };

  const toggleUseBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setToken('');
    setFormError('');
  };

  return (
    <div className="two-factor-verification-container">
      <div className="form-logo">
        <span className="logo-text">MyanCamp</span>
      </div>

      <h2>Two-Factor Authentication</h2>
      <p className="verification-instruction">
        {useBackupCode
          ? 'Enter one of your backup codes to complete login.'
          : 'Enter the verification code from your authenticator app.'}
      </p>

      {(formError || error) && (
        <div className="error-message">
          {formError || error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="verification-form">
        <div className="form-group">
          <label htmlFor="token">{useBackupCode ? 'Backup Code' : 'Verification Code'}</label>
          <input
            type="text"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={loading}
            placeholder={useBackupCode ? 'Enter backup code (e.g. XXXX-XXXX)' : 'Enter 6-digit code'}
            autoComplete="one-time-code"
            autoFocus
          />
        </div>

        <button type="submit" className="verify-button" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        <button
          type="button"
          className="toggle-backup-button"
          onClick={toggleUseBackupCode}
          disabled={loading}
        >
          {useBackupCode
            ? 'Use authenticator app instead'
            : 'Use backup code instead'}
        </button>

        {onCancel && (
          <button
            type="button"
            className="cancel-button"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        )}
      </form>
    </div>
  );
};

export default TwoFactorVerification;