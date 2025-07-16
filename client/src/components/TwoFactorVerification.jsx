import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setFormError(t('twoFactorVerification.verificationCodeRequired'));
      return;
    }

    try {
      await verifyTwoFactor(token, false);
      addSuccessMessage(t('twoFactorVerification.verificationSuccessful'));
      navigate('/'); // Redirect to home page after successful login
    } catch (err) {
      logError('2FA verification error', err);
      addErrorMessage(err.message || t('twoFactorVerification.verificationFailed'));
    }
  };

  return (
    <CSSIsolationWrapper section="common" className="two-factor-verification-container">
      <div className="common-form-logo">
        <span className="common-logo-text">AdventureMate</span>
      </div>

      <h2>{t('twoFactorVerification.title')}</h2>
      <p className="verification-instruction">{t('twoFactorVerification.instruction')}</p>

      {(formError || error) && <div className="common-error-message">{formError || error}</div>}

      <form onSubmit={handleSubmit} className="common-verification-form">
        <div className="common-form-group">
          <label htmlFor="token">{t('twoFactorVerification.verificationCode')}</label>
          <input
            type="text"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={loading}
            placeholder={t('twoFactorVerification.enter6DigitCode')}
            autoComplete="one-time-code"
            autoFocus
          />
        </div>

        <button type="submit" className="common-btn common-btn-primary" disabled={loading}>
          {loading ? t('twoFactorVerification.verifying') : t('twoFactorVerification.verify')}
        </button>

        {onCancel && (
          <button
            type="button"
            className="common-btn common-btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {t('twoFactorVerification.cancel')}
          </button>
        )}
      </form>
    </CSSIsolationWrapper>
  );
};

export default TwoFactorVerification;
