import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import { useTheme } from '../context/ThemeContext';
import { extractAuthCodeFromURL, clearOAuthParamsFromURL } from '../utils/googleOAuth';
import { logError } from '../utils/logger';

import { useTranslation } from 'react-i18next';
import './GoogleOAuthCallbackPage.css';

/**
 * Google OAuth Callback Page
 * Handles the OAuth callback from Google and completes the login process
 */
const GoogleOAuthCallbackPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { googleLogin } = useAuth();
  const { addSuccessMessage, addErrorMessage } = useFlashMessage();
  const { setSpecificTheme } = useTheme();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    let redirectTimeout;

    const handleOAuthCallback = async () => {
      // Restore theme from localStorage after OAuth redirect
      try {
        const storedTheme = localStorage.getItem('adventuremate-theme');
        if (storedTheme && ['light', 'dark'].includes(storedTheme)) {
          setSpecificTheme(storedTheme);
        }
      } catch (error) {
        // Silent error handling for theme restoration
      }

      // Prevent multiple executions
      if (hasProcessedRef.current) {
        return;
      }

      // Check if there's an authorization code in the URL
      const code = extractAuthCodeFromURL(location.search);
      if (!code) {
        setStatus('error');
        addErrorMessage('No authorization code received from Google');
        // Redirect to login page after a delay
        redirectTimeout = setTimeout(() => {
          try {
            navigate('/login', { replace: true });
          } catch (navError) {
            window.location.href = '/login';
          }
        }, 3000);
        return;
      }

      // Mark as processed immediately to prevent multiple calls
      hasProcessedRef.current = true;

      try {
        // Check for error parameters
        const urlParams = new URLSearchParams(location.search);
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        // Clear OAuth parameters from URL
        clearOAuthParamsFromURL();

        // Complete the OAuth login
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        const userOrResponse = await googleLogin(code, redirectUri);

        // Check for 2FA requirement (backend returns requiresTwoFactor)
        if (userOrResponse && userOrResponse.requiresTwoFactor) {
          // Store tempAccessToken for 2FA verification
          localStorage.setItem('tempAccessToken', userOrResponse.tempAccessToken);
          // Optionally store user info if needed
          localStorage.setItem('pending2FAUser', JSON.stringify(userOrResponse.user));
          setStatus('processing');
          addSuccessMessage(
            t('auth.twoFactorVerificationRequired') ||
              'Two-factor authentication required. Please enter your code.'
          );
          // Redirect to login page - the ProtectedRoute will handle 2FA verification
          redirectTimeout = setTimeout(() => {
            try {
              navigate('/login', { replace: true });
            } catch (navError) {
              // Fallback to window.location if navigate fails
              window.location.href = '/login';
            }
          }, 1000);
          return;
        }

        // If no 2FA required, proceed as before
        if (userOrResponse) {
          setStatus('success');
          addSuccessMessage(t('auth.googleLoginSuccess') || 'Successfully logged in with Google!');

          // Redirect to home page after a short delay
          redirectTimeout = setTimeout(() => {
            try {
              navigate('/', { replace: true });
            } catch (navError) {
              // Fallback to window.location if navigate fails
              window.location.href = '/';
            }
          }, 1500);
        } else {
          throw new Error('Failed to complete Google login');
        }
      } catch (error) {
        logError('Google OAuth callback error', error);
        setStatus('error');

        // Handle specific error cases
        let errorMessage = t('auth.googleLoginError') || 'Failed to complete Google login';
        let redirectDelay = 3000;

        if (error.response && error.response.data) {
          const errorData = error.response.data;

          // Handle invalid_grant error (code already used or expired)
          if (errorData.error === 'invalid_grant') {
            errorMessage =
              t('auth.invalidGrantError') ||
              'The Google login session has expired or the authorization code has already been used. Please try logging in again.';
            redirectDelay = 5000;
          }
          // Handle email already registered error
          else if (errorData.code === 'EMAIL_ALREADY_REGISTERED') {
            errorMessage =
              t('auth.emailAlreadyRegisteredWithGoogle') ||
              'An account with this email already exists. Please log in using your email and password instead of Google OAuth.';
            redirectDelay = 5000; // Give more time to read the message
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        addErrorMessage(errorMessage);

        // Redirect to login page after a delay
        redirectTimeout = setTimeout(() => {
          try {
            navigate('/login', { replace: true });
          } catch (navError) {
            // Fallback to window.location if navigate fails
            window.location.href = '/login';
          }
        }, redirectDelay);
      }
    };

    handleOAuthCallback();

    // Cleanup function
    return () => {
      // Clear any pending redirects
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
      // Don't reset hasProcessedRef here as we want to prevent multiple calls
    };
  }, [
    location.search,
    googleLogin,
    navigate,
    addSuccessMessage,
    addErrorMessage,
    t,
    setSpecificTheme,
  ]);

  // Additional effect to ensure theme is restored when component mounts
  useEffect(() => {
    const restoreTheme = () => {
      try {
        const storedTheme = localStorage.getItem('adventuremate-theme');
        if (storedTheme && ['light', 'dark'].includes(storedTheme)) {
          setSpecificTheme(storedTheme);
        }
      } catch (error) {
        // Silent error handling for theme restoration
      }
    };

    // Restore theme after a short delay to ensure everything is loaded
    const timeoutId = setTimeout(restoreTheme, 50);

    return () => clearTimeout(timeoutId);
  }, [setSpecificTheme]);

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="oauth-callback-processing">
            <div className="oauth-callback-spinner"></div>
            <h2>{t('auth.completingGoogleLogin') || 'Completing Google Login...'}</h2>
            <p>{t('auth.pleaseWait') || 'Please wait while we complete your login.'}</p>
          </div>
        );

      case 'success':
        return (
          <div className="oauth-callback-success">
            <div className="oauth-callback-icon success">✓</div>
            <h2>{t('auth.googleLoginSuccess') || 'Login Successful!'}</h2>
            <p>{t('auth.redirectingToHome') || 'Redirecting you to the home page...'}</p>
          </div>
        );

      case 'error':
        return (
          <div className="oauth-callback-error">
            <div className="oauth-callback-icon error">✗</div>
            <h2>{t('auth.googleLoginError') || 'Login Failed'}</h2>
            <p>{t('auth.redirectingToLogin') || 'Redirecting you back to the login page...'}</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="oauth-callback-page">
      <div className="oauth-callback-container">{renderContent()}</div>
    </div>
  );
};

export default GoogleOAuthCallbackPage;
