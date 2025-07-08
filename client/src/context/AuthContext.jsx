import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import authService from '../services/AuthService';
import { logInfo, logError } from '../utils/logger';

// Create the context
const AuthContext = createContext();

/**
 * Custom hook to use the auth context
 * @returns {Object} The auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Auth provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [isLoginAttempt, setIsLoginAttempt] = useState(false);

  // Dispatch auth state change event
  const dispatchAuthStateChange = (isAuthenticated) => {
    const event = new CustomEvent('authStateChange', {
      detail: { isAuthenticated }
    });
    window.dispatchEvent(event);
  };

  // Check if user is logged in on initial load
  useEffect(() => {
    // Generate a unique ID for this tab
    const generateTabId = () => {
      return Date.now().toString() + Math.random().toString(36).substring(2);
    };

    // Set a unique ID for this tab
    const tabId = generateTabId();
    localStorage.setItem('auth_tab_id', tabId);

    // Check if this is a new tab by comparing with the last active tab
    const lastTabId = localStorage.getItem('auth_last_tab');
    const isNewTab = lastTabId !== tabId;

    // Update the last active tab
    localStorage.setItem('auth_last_tab', tabId);

    const checkAuthStatus = async (forceCheck = false) => {
      try {
        setLoading(true);
        const authData = await authService.checkAuthStatus(forceCheck);

        if (authData) {
          // Only set the user as currentUser if they don't require 2FA
          // This prevents users from being considered "authenticated" before completing 2FA
          if (authData.requiresTwoFactor) {
            setCurrentUser(null);
            setRequiresTwoFactor(true);
            dispatchAuthStateChange(false);
          } else {
            setCurrentUser(authData.user);
            setRequiresTwoFactor(false);
            dispatchAuthStateChange(!!authData.user);
          }
        } else {
          setCurrentUser(null);
          setRequiresTwoFactor(false);
          dispatchAuthStateChange(false);
        }

        // Only clear error if we're not in the middle of a login attempt
        // This prevents clearing login errors while the user is still on the login form
        if (!isLoginAttempt) {
          setError(null);
        }
      } catch (err) {
        logError('Error checking auth status', err);
        // Only set auth error if there's no existing error (don't override login errors)
        if (!error && !isLoginAttempt) {
          setError('Failed to authenticate user');
        }
      } finally {
        setLoading(false);
      }
    };

    // If this is a new tab, force a check with the server
    checkAuthStatus(isNewTab);

    // Set up an interval to periodically check auth status
    // Increase interval to 10 minutes (600,000 ms)
    const intervalId = setInterval(
      () => {
        const now = Date.now();
        const lastForceCheck = localStorage.getItem('auth_last_force_check');
        const shouldForceCheck = !lastForceCheck || now - parseInt(lastForceCheck) > 10 * 60 * 1000; // 10 minutes

        if (shouldForceCheck) {
          localStorage.setItem('auth_last_force_check', now.toString());
          checkAuthStatus(true);
        } else {
          checkAuthStatus(false);
        }
      },
      10 * 60 * 1000
    ); // 10 minutes

    // Listen for storage events to detect changes in other tabs
    const handleStorageChange = (event) => {
      if (event.key === 'auth_status_updated') {
        logInfo('Auth status updated in another tab, refreshing');
        setTimeout(() => {
          checkAuthStatus(true);
        }, 100);
      }
    };

    // Add event listener for storage events
    window.addEventListener('storage', handleStorageChange);

    // Add event listener for tab visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logInfo('Tab became visible, checking auth status');
        checkAuthStatus(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up the interval and event listeners when the component unmounts
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Login function
  const login = async (username, password, rememberMe = false) => {
    console.log('🔍 AuthContext: login function called');
    setLoading(true);
    setError(null);
    setRequiresTwoFactor(false);
    setIsLoginAttempt(true);

    try {
      console.log('🔍 AuthContext: Calling authService.login');
      const result = await authService.login(username, password, rememberMe);
      console.log('🔍 AuthContext: authService.login result:', result);

      // Check if 2FA is required
      if (result && result.requiresTwoFactor) {
        console.log('🔍 AuthContext: 2FA required');
        setRequiresTwoFactor(true);
        return { requiresTwoFactor: true, userId: result.userId };
      }

      console.log('🔍 AuthContext: Login successful, setting currentUser');
      setCurrentUser(result);
      dispatchAuthStateChange(true);
      return result;
    } catch (err) {
      console.log('🔍 AuthContext: Login error caught:', err);
      // Extract error message from the error object
      let errorMessage = 'Failed to login';

      if (err.response && err.response.data) {
        // API error response
        errorMessage = err.response.data.message || err.response.data.error || errorMessage;
      } else if (err.message) {
        // JavaScript error
        errorMessage = err.message;
      }

      console.log('🔍 AuthContext: Setting error message:', errorMessage);
      setError(errorMessage);
      // Don't throw the error - let the component handle it
      return null;
    } finally {
      console.log('🔍 AuthContext: Login function finally block');
      setLoading(false);
      setIsLoginAttempt(false);
    }
  };

  // Verify 2FA token during login
  const verifyTwoFactor = async (token, useBackupCode = false) => {
    setLoading(true);
    setError(null);

    try {
      const user = await authService.verifyTwoFactor(token, useBackupCode);
      setCurrentUser(user);
      setRequiresTwoFactor(false);
      dispatchAuthStateChange(true);
      return user;
    } catch (err) {
      setError(err.message || 'Failed to verify 2FA token');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await authService.logout();
      setCurrentUser(null);
      setRequiresTwoFactor(false);
      dispatchAuthStateChange(false);
    } catch (err) {
      setError('Failed to logout');
      logError('Logout error', err);
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const user = await authService.register(userData);

      // Only set the user as currentUser if their email is verified
      // This prevents users from being "logged in" before email verification
      if (user && user.isEmailVerified) {
        setCurrentUser(user);
        dispatchAuthStateChange(true);
      } else {
        // Don't set currentUser if email is not verified
        // The user will need to verify their email first
        setCurrentUser(null);
        dispatchAuthStateChange(false);
      }

      return user;
    } catch (err) {
      // Extract error message from the error object
      let errorMessage = 'Failed to register';

      if (err.response && err.response.data) {
        // API error response
        errorMessage = err.response.data.message || err.response.data.error || errorMessage;
      } else if (err.message) {
        // JavaScript error
        errorMessage = err.message;
      }

      setError(errorMessage);
      // Don't throw the error - let the component handle it
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Token refresh function
  const refreshAccessToken = async () => {
    try {
      return await authService.refreshAccessToken();
    } catch (err) {
      logError('Error refreshing token', err);
      // If token refresh fails, log the user out
      await logout();
      throw err;
    }
  };

  // Request password reset function
  const requestPasswordReset = async (email) => {
    setLoading(true);
    setError(null);

    try {
      const message = await authService.requestPasswordReset(email);
      return message;
    } catch (err) {
      setError(err.message || 'Failed to request password reset');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (token, password) => {
    setLoading(true);
    setError(null);

    try {
      const message = await authService.resetPassword(token, password);
      return message;
    } catch (err) {
      setError(err.message || 'Failed to reset password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Google login function
  const googleLogin = async (code, redirectUri) => {
    setLoading(true);
    setError(null);

    try {
      const user = await authService.googleLogin(code, redirectUri);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.message || 'Failed to login with Google');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Facebook login function
  const facebookLogin = async (code, redirectUri) => {
    setLoading(true);
    setError(null);

    try {
      const user = await authService.facebookLogin(code, redirectUri);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.message || 'Failed to login with Facebook');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear login attempt flag
  const clearLoginAttempt = () => {
    setIsLoginAttempt(false);
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      currentUser,
      loading,
      error,
      login,
      logout,
      register,
      verifyTwoFactor,
      refreshAccessToken,
      requestPasswordReset,
      resetPassword,
      googleLogin,
      facebookLogin,
      requiresTwoFactor,
      isAuthenticated: !!currentUser && currentUser?.isEmailVerified && !requiresTwoFactor,
      clearLoginAttempt,
    }),
    [
      currentUser,
      loading,
      error,
      requiresTwoFactor,
      // (add other dependencies if needed)
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
