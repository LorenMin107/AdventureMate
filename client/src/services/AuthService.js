import apiClient from '../utils/api';
import { jwtDecode } from 'jwt-decode';
import { logError, logInfo } from '../utils/logger';

// Constants for authentication state management
const AUTH_CACHE_KEY = 'auth_status_cache';
const AUTH_CACHE_EXPIRY = 'auth_cache_expiry';
const AUTH_DEBOUNCE_KEY = 'auth_debounce_timestamp';
const AUTH_TAB_ID_KEY = 'auth_tab_id';
const AUTH_LAST_TAB_KEY = 'auth_last_tab';
const AUTH_STATUS_UPDATED_KEY = 'auth_status_updated';
const DEBOUNCE_INTERVAL = 2000; // 2 seconds debounce
const CACHE_DURATION = 30 * 1000; // 30 seconds (reduced from 5 minutes for faster updates)
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

/**
 * AuthService - A service for handling authentication-related functionality
 */
class AuthService {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    this.refreshPromise = null;
    this.refreshTimeout = null;

    // Initialize token refresh scheduling if we have a token
    if (this.accessToken) {
      this.scheduleTokenRefresh();
    }
  }

  /**
   * Helper function to update the cache and broadcast changes
   * @param {Object} user - The user object
   * @param {boolean} requiresTwoFactor - Whether 2FA is required
   */
  updateAuthCache(user, requiresTwoFactor = false) {
    // Get the current cached auth status to compare
    const currentCache = this.getCachedAuth();
    const newCache = user ? { user, requiresTwoFactor } : null;

    // Check if there's an actual change in authentication status
    const hasChanged =
      (!currentCache && newCache) ||
      (currentCache && !newCache) ||
      (currentCache &&
        newCache &&
        (currentCache.user?._id !== newCache.user?._id ||
          currentCache.requiresTwoFactor !== newCache.requiresTwoFactor));

    if (user) {
      const cacheData = {
        user,
        requiresTwoFactor,
      };
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(AUTH_CACHE_EXPIRY, (Date.now() + CACHE_DURATION).toString());
    } else {
      localStorage.removeItem(AUTH_CACHE_KEY);
      localStorage.removeItem(AUTH_CACHE_EXPIRY);
    }

    // Only broadcast if there's an actual change in authentication status
    if (hasChanged) {
      logInfo('Auth status changed, broadcasting to other tabs');
      localStorage.setItem(AUTH_STATUS_UPDATED_KEY, Date.now().toString());
    }
  }

  /**
   * Get the cached authentication status
   * @returns {Object|null} The cached authentication status
   */
  getCachedAuth() {
    const cachedAuth = localStorage.getItem(AUTH_CACHE_KEY);
    const cacheExpiry = localStorage.getItem(AUTH_CACHE_EXPIRY);
    const now = Date.now();

    if (cachedAuth && cacheExpiry && now < parseInt(cacheExpiry)) {
      return JSON.parse(cachedAuth);
    }

    return null;
  }

  /**
   * Check if the user is authenticated
   * @param {boolean} forceCheck - Whether to force a check with the server
   * @returns {Promise<Object>} The user object if authenticated
   */
  async checkAuthStatus(forceCheck = false) {
    try {
      // Implement debouncing to prevent excessive API calls
      const lastCallTimestamp = localStorage.getItem(AUTH_DEBOUNCE_KEY);
      const now = Date.now();

      // Only debounce if it's not a forced check and we have a recent timestamp
      if (
        !forceCheck &&
        lastCallTimestamp &&
        now - parseInt(lastCallTimestamp) < DEBOUNCE_INTERVAL
      ) {
        logInfo('Auth status check debounced, skipping');
        return this.getCachedAuth();
      }

      // Update the debounce timestamp only for non-forced checks
      if (!forceCheck) {
        localStorage.setItem(AUTH_DEBOUNCE_KEY, now.toString());
      }

      // Check if we have a cached auth status that's still valid
      const cachedAuth = this.getCachedAuth();

      // If we have a valid cache and not forcing a check, use it
      if (!forceCheck && cachedAuth) {
        logInfo('Using cached auth status');
        return cachedAuth;
      }

      // No valid cache or forcing a check, make the API call
      logInfo('Making API call to check auth status');

      // Using the v1 API endpoint for JWT-based authentication
      const response = await apiClient.get('/auth/status');
      const data = response.data;

      // Cache the auth status
      if (data.user) {
        this.updateAuthCache(data.user, data.requiresTwoFactor || false);
      } else {
        this.updateAuthCache(null, false);
      }

      return {
        user: data.user,
        requiresTwoFactor: data.requiresTwoFactor || false,
      };
    } catch (err) {
      logError('Error checking auth status', err);
      throw err;
    }
  }

  /**
   * Login a user
   * @param {string} username - The username or email
   * @param {string} password - The password
   * @param {boolean} rememberMe - Whether to remember the user
   * @returns {Promise<Object>} The user object if login is successful
   */
  async login(username, password, rememberMe = false) {
    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password,
        rememberMe,
      });

      const data = response.data;

      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        // Store temporary access token for 2FA verification
        if (data.tempAccessToken) {
          localStorage.setItem('tempAccessToken', data.tempAccessToken);
        }
        this.updateAuthCache(null, true);
        // Return 2FA data instead of throwing error
        return {
          requiresTwoFactor: true,
          userId: data.user._id,
          user: data.user,
          tempAccessToken: data.tempAccessToken,
        };
      }

      // Store JWT tokens
      if (data.accessToken) {
        this.accessToken = data.accessToken;
        localStorage.setItem('accessToken', data.accessToken);
        this.scheduleTokenRefresh();
      }
      if (data.refreshToken) {
        this.refreshToken = data.refreshToken;
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      // Update the cache with the latest authentication status
      this.updateAuthCache(data.user, false);

      return data.user;
    } catch (err) {
      logError('Error logging in', err);

      // Extract meaningful error message from API response
      if (err.response && err.response.data) {
        // API error response with specific error message
        const errorMessage = err.response.data.error || err.response.data.message || 'Login failed';

        // Create a new error with the API response data
        const apiError = new Error(errorMessage);
        apiError.response = err.response;
        apiError.status = err.response.status;
        throw apiError;
      } else if (err.message) {
        // JavaScript error with message
        throw new Error(err.message);
      } else {
        // Generic error
        throw new Error('Login failed. Please check your credentials and try again.');
      }
    }
  }

  /**
   * Verify a 2FA token during login
   * @param {string} token - The 2FA token
   * @param {boolean} useBackupCode - Whether to use a backup code
   * @returns {Promise<Object>} The user object if verification is successful
   */
  async verifyTwoFactor(token, useBackupCode = false) {
    try {
      // Get the temporary access token if available
      const tempAccessToken = localStorage.getItem('tempAccessToken');

      const headers = {};
      // Add temporary access token to headers if available
      if (tempAccessToken) {
        headers['Authorization'] = `Bearer ${tempAccessToken}`;
      }

      const response = await apiClient.post(
        '/2fa/verify-login',
        {
          token,
          useBackupCode,
        },
        { headers }
      );

      const data = response.data;

      // Clear temporary access token
      localStorage.removeItem('tempAccessToken');

      // Store the JWT tokens
      if (data.accessToken) {
        this.accessToken = data.accessToken;
        localStorage.setItem('accessToken', data.accessToken);
        this.scheduleTokenRefresh();
      }
      if (data.refreshToken) {
        this.refreshToken = data.refreshToken;
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      // Update the cache with the latest authentication status
      this.updateAuthCache(data.user, false);

      return data.user;
    } catch (err) {
      logError('Error verifying 2FA token', err);
      throw err;
    }
  }

  /**
   * Logout a user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // Cancel any scheduled token refresh
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout);
        this.refreshTimeout = null;
      }

      // Get the refresh token
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        // Logout API call
        await apiClient.post('/auth/logout', { token: refreshToken });
      }

      // Clear stored tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      this.accessToken = null;
      this.refreshToken = null;

      // Clear the cache and broadcast a message to other tabs
      this.updateAuthCache(null, false);
    } catch (err) {
      logError('Error logging out', err);
      // Still clear tokens even if the API call fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      this.accessToken = null;
      this.refreshToken = null;
      this.updateAuthCache(null, false);
      throw err;
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - The user data
   * @returns {Promise<Object>} The user object if registration is successful
   */
  async register(userData) {
    try {
      // Using the v1 API endpoint for JWT-based authentication
      const response = await apiClient.post('/auth/register', userData);
      const data = response.data;
      return data.user;
    } catch (err) {
      logError('Error registering user', err);

      // Extract meaningful error message from API response
      if (err.response && err.response.data) {
        // API error response with specific error message
        const errorMessage =
          err.response.data.error || err.response.data.message || 'Registration failed';

        // Create a new error with the API response data
        const apiError = new Error(errorMessage);
        apiError.response = err.response;
        apiError.status = err.response.status;
        throw apiError;
      } else if (err.message) {
        // JavaScript error with message
        throw new Error(err.message);
      } else {
        // Generic error
        throw new Error('Registration failed. Please try again.');
      }
    }
  }

  /**
   * Refresh the access token
   * @returns {Promise<string>} The new access token
   */
  async refreshAccessToken() {
    // If there's already a refresh in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    try {
      this.refreshPromise = new Promise(async (resolve, reject) => {
        try {
          if (!this.refreshToken) {
            this.refreshToken = localStorage.getItem('refreshToken');
          }

          if (!this.refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await apiClient.post('/auth/refresh-token', {
            token: this.refreshToken,
          });

          const data = response.data;

          if (data.accessToken) {
            this.accessToken = data.accessToken;
            localStorage.setItem('accessToken', data.accessToken);
            this.scheduleTokenRefresh();
            resolve(data.accessToken);
          } else {
            throw new Error('No access token returned');
          }
        } catch (err) {
          logError('Error refreshing token', err);
          // If token refresh fails, log the user out
          await this.logout();
          reject(err);
        } finally {
          this.refreshPromise = null;
        }
      });

      return this.refreshPromise;
    } catch (err) {
      logError('Error refreshing token', err);
      // If token refresh fails, log the user out
      await this.logout();
      throw err;
    }
  }

  /**
   * Schedule a token refresh before the access token expires
   */
  scheduleTokenRefresh() {
    // Cancel any existing refresh timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }

    // If we don't have an access token, don't schedule a refresh
    if (!this.accessToken) {
      return;
    }

    try {
      // Decode the token to get the expiration time
      const decodedToken = jwtDecode(this.accessToken);
      const expiresAt = decodedToken.exp * 1000; // Convert to milliseconds
      const now = Date.now();

      // Calculate time until refresh (5 minutes before expiry or half the token lifetime)
      const timeUntilRefresh = Math.max(0, expiresAt - now - TOKEN_REFRESH_THRESHOLD);

      logInfo(`Scheduling token refresh in ${timeUntilRefresh / 1000} seconds`);

      // Schedule the refresh
      this.refreshTimeout = setTimeout(() => {
        logInfo('Refreshing token...');
        this.refreshAccessToken().catch((err) => {
          logError('Failed to refresh token:', err);
        });
      }, timeUntilRefresh);
    } catch (err) {
      logError('Error scheduling token refresh', err);
    }
  }

  /**
   * Request a password reset
   * @param {string} email - The email address
   * @returns {Promise<string>} A success message
   */
  async requestPasswordReset(email) {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data.message;
    } catch (err) {
      logError('Error requesting password reset', err);

      // Extract meaningful error message from API response
      if (err.response && err.response.data) {
        // API error response with specific error message
        const errorMessage =
          err.response.data.error ||
          err.response.data.message ||
          'Failed to request password reset';

        // Create a new error with the API response data
        const apiError = new Error(errorMessage);
        apiError.response = err.response;
        apiError.status = err.response.status;
        throw apiError;
      } else if (err.message) {
        // JavaScript error with message
        throw new Error(err.message);
      } else {
        // Generic error
        throw new Error('Failed to request password reset. Please try again.');
      }
    }
  }

  /**
   * Reset a password
   * @param {string} token - The reset token
   * @param {string} password - The new password
   * @returns {Promise<string>} A success message
   */
  async resetPassword(token, password) {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        password,
      });
      return response.data.message;
    } catch (err) {
      logError('Error resetting password', err);

      // Extract meaningful error message from API response
      if (err.response && err.response.data) {
        // API error response with specific error message
        const errorMessage =
          err.response.data.error || err.response.data.message || 'Failed to reset password';

        // Create a new error with the API response data
        const apiError = new Error(errorMessage);
        apiError.response = err.response;
        apiError.status = err.response.status;
        throw apiError;
      } else if (err.message) {
        // JavaScript error with message
        throw new Error(err.message);
      } else {
        // Generic error
        throw new Error('Failed to reset password. Please try again.');
      }
    }
  }

  /**
   * Change password for authenticated user
   * @param {string} currentPassword - The current password
   * @param {string} newPassword - The new password
   * @param {string} twoFactorCode - The 2FA code (optional, required if 2FA is enabled)
   * @returns {Promise<string>} A success message
   */
  async changePassword(currentPassword, newPassword, twoFactorCode = null) {
    try {
      const requestBody = {
        currentPassword,
        newPassword,
      };

      // Add 2FA code if provided
      if (twoFactorCode) {
        requestBody.twoFactorCode = twoFactorCode;
      }

      const response = await apiClient.put('/users/change-password', requestBody);
      return response.data.message;
    } catch (err) {
      logError('Error changing password', err);

      // Extract meaningful error message from API response
      if (err.response && err.response.data) {
        // API error response with specific error message
        const errorMessage =
          err.response.data.error || err.response.data.message || 'Failed to change password';

        // Create a new error with the API response data
        const apiError = new Error(errorMessage);
        apiError.response = err.response;
        apiError.status = err.response.status;
        apiError.requiresTwoFactor = err.response.data.requiresTwoFactor || false;
        throw apiError;
      } else if (err.message) {
        // JavaScript error with message
        throw new Error(err.message);
      } else {
        // Generic error
        throw new Error('Failed to change password. Please try again.');
      }
    }
  }

  /**
   * Login with Google
   * @param {string} code - The authorization code
   * @param {string} redirectUri - The redirect URI
   * @returns {Promise<Object>} The user object if login is successful
   */
  async googleLogin(code, redirectUri) {
    try {
      const response = await apiClient.post('/auth/google', {
        code,
        redirectUri,
      });

      const data = response.data;

      // Store JWT tokens
      if (data.accessToken) {
        this.accessToken = data.accessToken;
        localStorage.setItem('accessToken', data.accessToken);
        this.scheduleTokenRefresh();
      }
      if (data.refreshToken) {
        this.refreshToken = data.refreshToken;
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      // Update the cache with the latest authentication status
      this.updateAuthCache(data.user, false);

      return data.user;
    } catch (err) {
      logError('Error logging in with Google', err);
      throw err;
    }
  }

  /**
   * Login with Facebook
   * @param {string} code - The authorization code
   * @param {string} redirectUri - The redirect URI
   * @returns {Promise<Object>} The user object if login is successful
   */
  async facebookLogin(code, redirectUri) {
    try {
      const response = await apiClient.post('/auth/facebook', {
        code,
        redirectUri,
      });

      const data = response.data;

      // Store JWT tokens
      if (data.accessToken) {
        this.accessToken = data.accessToken;
        localStorage.setItem('accessToken', data.accessToken);
        this.scheduleTokenRefresh();
      }
      if (data.refreshToken) {
        this.refreshToken = data.refreshToken;
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      // Update the cache with the latest authentication status
      this.updateAuthCache(data.user, false);

      return data.user;
    } catch (err) {
      logError('Error logging in with Facebook', err);
      throw err;
    }
  }

  /**
   * Get the current access token
   * @returns {string|null} The access token
   */
  getAccessToken() {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  /**
   * Get the current refresh token
   * @returns {string|null} The refresh token
   */
  getRefreshToken() {
    if (!this.refreshToken) {
      this.refreshToken = localStorage.getItem('refreshToken');
    }
    return this.refreshToken;
  }

  /**
   * Check if a token is valid and not expired
   * @param {string} token - The token to validate
   * @returns {boolean} Whether the token is valid
   */
  isTokenValid(token) {
    if (!token) {
      return false;
    }

    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decodedToken.exp > currentTime;
    } catch (err) {
      logError('Error validating token', err);
      return false;
    }
  }

  /**
   * Check if the current access token is valid
   * @returns {boolean} Whether the access token is valid
   */
  isAccessTokenValid() {
    return this.isTokenValid(this.getAccessToken());
  }

  /**
   * Check if the current refresh token is valid
   * @returns {boolean} Whether the refresh token is valid
   */
  isRefreshTokenValid() {
    return this.isTokenValid(this.getRefreshToken());
  }
}

// Create a singleton instance
const authService = new AuthService();

export default authService;
