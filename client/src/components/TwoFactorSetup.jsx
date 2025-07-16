import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import './TwoFactorSetup.css';
import { logInfo, logDebug, logError } from '../utils/logger';

/**
 * Two-factor authentication setup component
 * Allows users to enable 2FA for their account
 */
const TwoFactorSetup = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState('initial');
  const [token, setToken] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [formError, setFormError] = useState('');
  const [isSetupInProgress, setIsSetupInProgress] = useState(false);
  const qrCodeImgRef = useRef(null);
  const componentMounted = useRef(true);
  const setupDataRef = useRef(null); // Store setup data persistently
  const { userDetails, initiate2FASetup, verify2FASetup, disable2FA, loading, error } = useUser();
  const { addSuccessMessage, addErrorMessage } = useFlashMessage();

  // Track component mount/unmount with more debugging
  useEffect(() => {
    logInfo('TwoFactorSetup component mounted');
    logDebug('Component props/context at mount', { userDetails, loading, error });
    componentMounted.current = true;

    return () => {
      logInfo('TwoFactorSetup component unmounted');
      logDebug('Component state at unmount', { step, qrCode: Boolean(qrCode), isSetupInProgress });
      componentMounted.current = false;
    };
  }, []);

  // Watch for userDetails changes that might cause unmounting
  useEffect(() => {
    logDebug('UserDetails changed', userDetails);
  }, [userDetails]);

  // Watch for loading state changes
  useEffect(() => {
    logDebug('Loading state changed', loading);
  }, [loading]);

  // Restore state from ref if component remounts
  useEffect(() => {
    if (setupDataRef.current && !qrCode) {
      logInfo('Restoring setup data from ref', setupDataRef.current);
      setQrCode(setupDataRef.current.qrCode);
      setSecret(setupDataRef.current.secret);
      setStep('qrCode');
    }
  }, [qrCode]);

  // Start the 2FA setup process
  const handleStartSetup = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    if (isSetupInProgress) {
      logInfo('Setup already in progress, ignoring');
      return;
    }

    logDebug('handleStartSetup called, current state', {
      step,
      isSetupInProgress,
      componentMounted: componentMounted.current,
    });

    setIsSetupInProgress(true);
    setFormError('');

    try {
      logInfo('Starting 2FA setup...');
      const result = await initiate2FASetup();
      logDebug('2FA setup result', result);

      // Store in ref for persistence across remounts
      setupDataRef.current = {
        qrCode: result.qrCode,
        secret: result.secret,
      };

      // Check if component is still mounted before updating state
      if (componentMounted.current && result.qrCode) {
        logInfo('Component still mounted, setting QR code and updating step');

        // Use callback form to ensure state updates are applied
        setQrCode((prevQrCode) => {
          logDebug(
            'Setting QR code from',
            prevQrCode,
            'to',
            result.qrCode.substring(0, 50) + '...'
          );
          return result.qrCode;
        });

        setSecret((prevSecret) => {
          logDebug('Setting secret from', prevSecret, 'to', result.secret);
          return result.secret;
        });

        setStep((prevStep) => {
          logDebug('Setting step from', prevStep, 'to: qrCode');
          return 'qrCode';
        });

        logInfo('All states updated, current step should be qrCode');
      } else {
        logInfo('Component unmounted or no QR code in result');
      }
    } catch (err) {
      logError('Error initiating 2FA setup', err);
      if (componentMounted.current) {
        setFormError(err.message || t('twoFactor.setupError'));
      }
    } finally {
      if (componentMounted.current) {
        setIsSetupInProgress(false);
      }
    }
  };

  // Verify the token to complete 2FA setup
  const handleVerifyToken = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!token.trim()) {
      setFormError(t('twoFactor.verificationCodeRequired'));
      return;
    }

    try {
      const result = await verify2FASetup(token);
      setBackupCodes(result.backupCodes);
      setStep('backupCodes');
      addSuccessMessage(t('twoFactor.enabledSuccess'));
    } catch (err) {
      logError('Error verifying 2FA setup', err);
      setFormError(err.message || t('twoFactor.invalidCode'));
    }
  };

  // Disable 2FA
  const handleDisable2FA = async (e) => {
    if (e) e.preventDefault();
    setFormError('');

    if (!token.trim()) {
      setFormError(t('twoFactor.verificationCodeRequiredDisable'));
      return;
    }

    try {
      await disable2FA(token);
      setStep('initial');
      setToken('');
      setQrCode('');
      setSecret('');
      setBackupCodes([]);
      setupDataRef.current = null;
      addSuccessMessage(t('twoFactor.disabledSuccess'));
    } catch (err) {
      logError('Error disabling 2FA', err);
      setFormError(err.message || t('twoFactor.disableError'));
    }
  };

  // Reset the setup process
  const handleCancel = () => {
    setStep('initial');
    setToken('');
    setQrCode('');
    setSecret('');
    setBackupCodes([]);
    setFormError('');
    setIsSetupInProgress(false);
    setupDataRef.current = null;
  };

  // Render different content based on the current step
  const renderContent = () => {
    logDebug('Rendering content for step', step);
    logDebug('QR code available', Boolean(qrCode));
    logDebug('QR code length', qrCode ? qrCode.length : 0);

    // If 2FA is already enabled, show disable option
    if (userDetails?.isTwoFactorEnabled) {
      return (
        <div className="two-factor-setup__container">
          <div className="two-factor-setup__header">
            <h2>{t('twoFactor.title')}</h2>
            <p>{t('twoFactor.currentlyEnabled')}</p>
            <p>{t('twoFactor.disableInstructions')}</p>
          </div>

          <form onSubmit={handleDisable2FA} className="two-factor-setup__form">
            <div className="form-group">
              <label htmlFor="disable-verification-token">{t('twoFactor.verificationCode')}:</label>
              <input
                type="text"
                id="disable-verification-token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={t('twoFactor.enter6DigitCode')}
                maxLength="6"
                className="form-control"
                required
              />
            </div>

            <div className="two-factor-setup__actions">
              <button type="submit" className="btn btn-danger" disabled={loading || !token.trim()}>
                {loading ? t('twoFactor.disabling') : t('twoFactor.disable2FA')}
              </button>
            </div>
          </form>
        </div>
      );
    }

    switch (step) {
      case 'initial':
        return (
          <div className="two-factor-setup__container">
            <div className="two-factor-setup__header">
              <h2>{t('twoFactor.enableTitle')}</h2>
              <p>{t('twoFactor.enableDescription')}</p>
            </div>

            <div className="two-factor-setup__actions">
              <button
                type="button"
                onClick={handleStartSetup}
                className="btn btn-primary"
                disabled={loading || isSetupInProgress}
                style={{ pointerEvents: 'auto' }} // Ensure button is clickable
              >
                {loading || isSetupInProgress ? t('twoFactor.settingUp') : t('twoFactor.setup2FA')}
              </button>
            </div>
          </div>
        );

      case 'qrCode':
        return (
          <div className="two-factor-setup__container">
            <div className="two-factor-setup__header">
              <h2>{t('twoFactor.scanQRCode')}</h2>
              <p>{t('twoFactor.scanInstructions')}</p>
            </div>

            <div className="two-factor-setup__qr-section">
              {qrCode ? (
                <div className="two-factor-setup__qr-container">
                  <img
                    ref={qrCodeImgRef}
                    src={qrCode}
                    alt={t('twoFactor.qrCodeAlt')}
                    className="two-factor-setup__qr-code"
                    style={{
                      maxWidth: '300px',
                      maxHeight: '300px',
                      border: '1px solid #ddd',
                      padding: '10px',
                      backgroundColor: 'white',
                      display: 'block',
                    }}
                    onLoad={() => logInfo('QR code image loaded successfully')}
                    onError={(e) => logError('QR code image failed to load:', e)}
                  />
                </div>
              ) : (
                <div>{t('twoFactor.loadingQRCode')}</div>
              )}

              {secret && (
                <div className="two-factor-setup__secret">
                  <p>
                    <strong>{t('twoFactor.manualEntryKey')}:</strong>
                  </p>
                  <code className="two-factor-setup__secret-code">{secret}</code>
                </div>
              )}
            </div>

            <form onSubmit={handleVerifyToken} className="two-factor-setup__form">
              <div className="form-group">
                <label htmlFor="verification-token">{t('twoFactor.enterVerificationCode')}:</label>
                <input
                  type="text"
                  id="verification-token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="123456"
                  maxLength="6"
                  className="form-control"
                  required
                />
              </div>

              <div className="two-factor-setup__actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !token.trim()}
                >
                  {loading ? t('twoFactor.verifying') : t('twoFactor.verifyAndEnable')}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  {t('twoFactor.cancel')}
                </button>
              </div>
            </form>
          </div>
        );

      case 'backupCodes':
        return (
          <div className="two-factor-setup__container">
            <div className="two-factor-setup__header">
              <h2>{t('twoFactor.backupCodes')}</h2>
              <p>{t('twoFactor.backupCodesDescription')}</p>
            </div>

            <div className="two-factor-setup__backup-codes">
              {backupCodes.map((code, index) => (
                <code key={index} className="two-factor-setup__backup-code">
                  {code}
                </code>
              ))}
            </div>

            <div className="two-factor-setup__actions">
              <button
                type="button"
                onClick={() => {
                  setStep('initial');
                  setupDataRef.current = null;
                }}
                className="btn btn-primary"
              >
                {t('twoFactor.completeSetup')}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="two-factor-setup">
      {formError && (
        <div className="alert alert-danger" role="alert">
          {formError}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {renderContent()}
    </div>
  );
};

export default TwoFactorSetup;
