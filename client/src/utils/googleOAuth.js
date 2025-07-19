/**
 * Google OAuth utility functions for handling OAuth flow
 */

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

// Google OAuth scopes
const GOOGLE_SCOPES = ['openid', 'profile', 'email'];

/**
 * Initialize Google OAuth
 * @returns {Promise<boolean>} Whether initialization was successful
 */
export const initializeGoogleOAuth = () => {
  return new Promise((resolve) => {
    // Load Google OAuth script if not already loaded
    if (window.gapi) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      // Error logging handled by caller
      resolve(false);
    };

    document.head.appendChild(script);
  });
};

/**
 * Get Google OAuth URL for authorization
 * @returns {string} Authorization URL
 */
export const getGoogleOAuthURL = () => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Handle Google OAuth callback
 * @param {string} code - Authorization code from Google
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
export const handleGoogleOAuthCallback = async (code, onSuccess, onError) => {
  try {
    // The actual OAuth exchange will be handled by the backend
    // We just need to pass the code to our backend
    const response = await fetch('/api/v1/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirectUri: GOOGLE_REDIRECT_URI,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      onSuccess(data);
    } else {
      onError(data.message || 'Google OAuth failed');
    }
  } catch (error) {
    // Error logging handled by caller
    onError('Failed to complete Google OAuth');
  }
};

/**
 * Extract authorization code from URL
 * @param {string} url - Current URL or query string
 * @returns {string|null} Authorization code if present
 */
export const extractAuthCodeFromURL = (url) => {
  // Handle both full URLs and query strings
  let queryString = url;
  if (url.includes('?')) {
    queryString = url.split('?')[1];
  }
  const urlParams = new URLSearchParams(queryString);
  return urlParams.get('code');
};

/**
 * Clear OAuth parameters from URL
 */
export const clearOAuthParamsFromURL = () => {
  const url = new URL(window.location);
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  window.history.replaceState({}, document.title, url.pathname);
};
