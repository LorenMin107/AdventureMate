import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import { logError } from '../utils/logger';
import CSSIsolationWrapper from './CSSIsolationWrapper';
import './TwoFactorVerification.css';

/**
 * Two-factor authentication verification component
 * Allows users to enter a TOTP code to complete login
 */
const TwoFactorVerification = ({ userId, onCancel }) => {
  const [token, setToken] = useState('');
  const [formError, setFormError] = useState('');
  const { verifyTwoFactor, error, loading } = useAuth();
  const { addSuccessMessage, addErrorMessage } = useFlashMessage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate form
    if (!token.trim()) {
      setFormError('Verification code is required');
      return;
    }

    try {
      await verifyTwoFactor(token, false);
      addSuccessMessage('Two-factor authentication successful! Welcome back.');
      navigate('/'); // Redirect to home page after successful login
    } catch (err) {
      logError('2FA verification error', err);
      addErrorMessage(err.message || 'Verification failed. Please try again.');
    }
  };

  return (
    <CSSIsolationWrapper section="common" className="two-factor-verification-container">
      <div className="common-form-logo">
        <span className="common-logo-text">AdventureMate</span>
      </div>

      <h2>Two-Factor Authentication</h2>
      <p className="verification-instruction">
        Enter the verification code from your authenticator app.
      </p>

      {(formError || error) && <div className="common-error-message">{formError || error}</div>}

      <form onSubmit={handleSubmit} className="common-verification-form">
        <div className="common-form-group">
          <label htmlFor="token">Verification Code</label>
          <input
            type="text"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={loading}
            placeholder="Enter 6-digit code"
            autoComplete="one-time-code"
            autoFocus
          />
        </div>

        <button type="submit" className="common-btn common-btn-primary" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        {onCancel && (
          <button
            type="button"
            className="common-btn common-btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        )}
      </form>
    </CSSIsolationWrapper>
  );
};

export default TwoFactorVerification;
