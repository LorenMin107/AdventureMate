import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import { getGoogleOAuthURL } from '../utils/googleOAuth';
import { logError } from '../utils/logger';
import { useTranslation } from 'react-i18next';
import './GoogleOAuthButton.css';

/**
 * Google OAuth Button Component
 * Handles Google OAuth login flow
 */
const GoogleOAuthButton = ({ onSuccess, onError, disabled = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { googleLogin, currentUser } = useAuth();
  const { addSuccessMessage, addErrorMessage } = useFlashMessage();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (isLoading || disabled) return;

    // Check if user is already logged in
    if (currentUser) {
      const errorMessage =
        t('auth.alreadyLoggedIn') ||
        'You are already logged in. Please log out first to use Google login.';
      addErrorMessage(errorMessage);
      if (onError) onError(errorMessage);
      return;
    }

    setIsLoading(true);
    try {
      // Clear any previous OAuth callback processing flag
      sessionStorage.removeItem('oauth_callback_processed');

      // Redirect to Google OAuth
      const authUrl = getGoogleOAuthURL();
      console.log('Google OAuth URL:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      logError('Google OAuth error', error);

      // Handle specific error cases
      let errorMessage = t('auth.googleLoginError') || 'Failed to start Google login';

      if (error.response && error.response.data) {
        const errorData = error.response.data;

        // Handle email already registered error
        if (errorData.code === 'EMAIL_ALREADY_REGISTERED') {
          errorMessage =
            t('auth.emailAlreadyRegisteredWithGoogle') ||
            'An account with this email already exists. Please log in using your email and password instead of Google OAuth.';
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      addErrorMessage(errorMessage);
      if (onError) onError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`google-oauth-button ${currentUser ? 'google-oauth-button-disabled' : ''}`}
      onClick={handleGoogleLogin}
      disabled={isLoading || disabled || currentUser}
      aria-label={
        currentUser
          ? t('auth.alreadyLoggedIn') || 'Already logged in'
          : t('auth.loginWithGoogle') || 'Login with Google'
      }
    >
      <div className="google-oauth-button-content">
        <svg className="google-oauth-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span className="google-oauth-text">
          {isLoading
            ? t('auth.connectingToGoogle') || 'Connecting to Google...'
            : currentUser
              ? t('auth.alreadyLoggedIn') || 'Already logged in'
              : t('auth.continueWithGoogle') || 'Continue with Google'}
        </span>
      </div>
    </button>
  );
};

export default GoogleOAuthButton;
