
import { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import './TwoFactorSetup.css';

/**
 * Two-factor authentication setup component
 * Allows users to enable 2FA for their account
 */
const TwoFactorSetup = () => {
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
    console.log('TwoFactorSetup component mounted');
    console.log('Component props/context at mount:', { userDetails, loading, error });
    componentMounted.current = true;

    return () => {
      console.log('TwoFactorSetup component unmounted');
      console.log('Component state at unmount:', { step, qrCode: Boolean(qrCode), isSetupInProgress });
      componentMounted.current = false;
    };
  }, []);

  // Watch for userDetails changes that might cause unmounting
  useEffect(() => {
    console.log('UserDetails changed:', userDetails);
  }, [userDetails]);

  // Watch for loading state changes
  useEffect(() => {
    console.log('Loading state changed:', loading);
  }, [loading]);

  // Restore state from ref if component remounts
  useEffect(() => {
    if (setupDataRef.current && !qrCode) {
      console.log('Restoring setup data from ref:', setupDataRef.current);
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
      console.log('Setup already in progress, ignoring');
      return;
    }

    console.log('handleStartSetup called, current state:', { step, isSetupInProgress, componentMounted: componentMounted.current });

    setIsSetupInProgress(true);
    setFormError('');

    try {
      console.log('Starting 2FA setup...');
      const result = await initiate2FASetup();
      console.log('2FA setup result:', result);

      // Store in ref for persistence across remounts
      setupDataRef.current = {
        qrCode: result.qrCode,
        secret: result.secret
      };

      // Check if component is still mounted before updating state
      if (componentMounted.current && result.qrCode) {
        console.log('Component still mounted, setting QR code and updating step');

        // Use callback form to ensure state updates are applied
        setQrCode(prevQrCode => {
          console.log('Setting QR code from:', prevQrCode, 'to:', result.qrCode.substring(0, 50) + '...');
          return result.qrCode;
        });

        setSecret(prevSecret => {
          console.log('Setting secret from:', prevSecret, 'to:', result.secret);
          return result.secret;
        });

        setStep(prevStep => {
          console.log('Setting step from:', prevStep, 'to: qrCode');
          return 'qrCode';
        });

        console.log('All states updated, current step should be qrCode');
      } else {
        console.log('Component unmounted or no QR code in result');
      }
    } catch (err) {
      console.error('Error initiating 2FA setup:', err);
      if (componentMounted.current) {
        setFormError(err.message || 'Failed to initiate 2FA setup. Please try again.');
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
      setFormError('Verification code is required');
      return;
    }

    try {
      const result = await verify2FASetup(token);
      setBackupCodes(result.backupCodes);
      setStep('backupCodes');
      addSuccessMessage('Two-factor authentication enabled successfully!');
    } catch (err) {
      console.error('Error verifying 2FA setup:', err);
      setFormError(err.message || 'Invalid verification code. Please try again.');
    }
  };

  // Disable 2FA
  const handleDisable2FA = async (e) => {
    if (e) e.preventDefault();
    setFormError('');

    if (!token.trim()) {
      setFormError('Verification code is required to disable 2FA');
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
      addSuccessMessage('Two-factor authentication disabled successfully.');
    } catch (err) {
      console.error('Error disabling 2FA:', err);
      setFormError(err.message || 'Failed to disable 2FA. Please try again.');
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
    console.log('Rendering content for step:', step);
    console.log('QR code available:', Boolean(qrCode));
    console.log('QR code length:', qrCode ? qrCode.length : 0);

    // If 2FA is already enabled, show disable option
    if (userDetails?.isTwoFactorEnabled) {
      return (
          <div className="two-factor-setup__container">
            <div className="two-factor-setup__header">
              <h2>Two-Factor Authentication</h2>
              <p>Two-factor authentication is currently enabled for your account.</p>
              <p>To disable 2FA, enter the verification code from your authenticator app.</p>
            </div>

            <form onSubmit={handleDisable2FA} className="two-factor-setup__form">
              <div className="form-group">
                <label htmlFor="disable-verification-token">Verification Code:</label>
                <input
                    type="text"
                    id="disable-verification-token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                    className="form-control"
                    required
                />
              </div>

              <div className="two-factor-setup__actions">
                <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={loading || !token.trim()}
                >
                  {loading ? 'Disabling...' : 'Disable 2FA'}
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
                <h2>Enable Two-Factor Authentication</h2>
                <p>
                  Add an extra layer of security to your account by enabling two-factor authentication.
                  You'll need an authenticator app like Google Authenticator or Authy.
                </p>
              </div>

              <div className="two-factor-setup__actions">
                <button
                    type="button"
                    onClick={handleStartSetup}
                    className="btn btn-primary"
                    disabled={loading || isSetupInProgress}
                    style={{ pointerEvents: 'auto' }} // Ensure button is clickable
                >
                  {loading || isSetupInProgress ? 'Setting up...' : 'Set up Two-Factor Authentication'}
                </button>
              </div>
            </div>
        );

      case 'qrCode':
        return (
            <div className="two-factor-setup__container">
              <div className="two-factor-setup__header">
                <h2>Scan QR Code</h2>
                <p>
                  Open your authenticator app and scan the QR code below, or manually enter the secret key.
                </p>
              </div>

              <div className="two-factor-setup__qr-section">
                {qrCode ? (
                    <div className="two-factor-setup__qr-container">
                      <img
                          ref={qrCodeImgRef}
                          src={qrCode}
                          alt="2FA QR Code"
                          className="two-factor-setup__qr-code"
                          style={{
                            maxWidth: '300px',
                            maxHeight: '300px',
                            border: '1px solid #ddd',
                            padding: '10px',
                            backgroundColor: 'white',
                            display: 'block'
                          }}
                          onLoad={() => console.log('QR code image loaded successfully')}
                          onError={(e) => console.error('QR code image failed to load:', e)}
                      />
                    </div>
                ) : (
                    <div>Loading QR code...</div>
                )}

                {secret && (
                    <div className="two-factor-setup__secret">
                      <p><strong>Manual Entry Key:</strong></p>
                      <code className="two-factor-setup__secret-code">{secret}</code>
                    </div>
                )}
              </div>

              <form onSubmit={handleVerifyToken} className="two-factor-setup__form">
                <div className="form-group">
                  <label htmlFor="verification-token">Enter verification code from your app:</label>
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
                    {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
                  </button>
                  <button
                      type="button"
                      onClick={handleCancel}
                      className="btn btn-secondary"
                      disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
        );

      case 'backupCodes':
        return (
            <div className="two-factor-setup__container">
              <div className="two-factor-setup__header">
                <h2>Backup Codes</h2>
                <p>
                  Save these backup codes in a safe place. You can use them to access your account
                  if you lose access to your authenticator app.
                </p>
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
                  Complete Setup
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
