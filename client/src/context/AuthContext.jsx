import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/AuthService';

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
          } else {
            setCurrentUser(authData.user);
            setRequiresTwoFactor(false);
          }
        } else {
          setCurrentUser(null);
          setRequiresTwoFactor(false);
        }

        setError(null);
      } catch (err) {
        console.error('Error checking auth status:', err);
        setError('Failed to authenticate user');
      } finally {
        setLoading(false);
      }
    };

    // If this is a new tab, force a check with the server
    checkAuthStatus(isNewTab);

    // Set up an interval to periodically check auth status
    // Use a longer interval and only force a check occasionally
    const intervalId = setInterval(() => {
      // Only force a check every 5 minutes, otherwise use cache if available
      const now = Date.now();
      const lastForceCheck = localStorage.getItem('auth_last_force_check');
      const shouldForceCheck = !lastForceCheck || now - parseInt(lastForceCheck) > 5 * 60 * 1000;

      if (shouldForceCheck) {
        localStorage.setItem('auth_last_force_check', now.toString());
        checkAuthStatus(true);
      } else {
        checkAuthStatus(false);
      }
    }, 60 * 1000); // 60 seconds (increased from 30 seconds)

    // Listen for storage events to detect changes in other tabs
    const handleStorageChange = (event) => {
      if (event.key === 'auth_status_updated') {
        console.log('Auth status updated in another tab, refreshing');

        // Add a small delay to prevent rapid successive calls
        setTimeout(() => {
          // Always force a check when auth status is updated from another tab
          // This ensures we get the latest authentication state
          checkAuthStatus(true);
        }, 100);
      }
    };

    // Add event listener for storage events
    window.addEventListener('storage', handleStorageChange);

    // Clean up the interval and event listener when the component unmounts
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Login function
  const login = async (username, password, rememberMe = false) => {
    setLoading(true);
    setError(null);
    setRequiresTwoFactor(false);

    try {
      const result = await authService.login(username, password, rememberMe);

      // Check if 2FA is required
      if (result && result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        return { requiresTwoFactor: true, userId: result.userId };
      }

      setCurrentUser(result);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to login');
      throw err;
    } finally {
      setLoading(false);
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
    } catch (err) {
      setError('Failed to logout');
      console.error('Logout error:', err);
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
      } else {
        // Don't set currentUser if email is not verified
        // The user will need to verify their email first
        setCurrentUser(null);
      }

      return user;
    } catch (err) {
      setError(err.message || 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Token refresh function
  const refreshAccessToken = async () => {
    try {
      return await authService.refreshAccessToken();
    } catch (err) {
      console.error('Error refreshing token:', err);
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

  // Context value
  const value = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
