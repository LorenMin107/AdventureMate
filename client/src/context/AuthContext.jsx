import { createContext, useContext, useState, useEffect } from 'react';

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
  // Constants for authentication state management
  const AUTH_CACHE_KEY = 'auth_status_cache';
  const AUTH_CACHE_EXPIRY = 'auth_cache_expiry';
  const AUTH_DEBOUNCE_KEY = 'auth_debounce_timestamp';
  const AUTH_TAB_ID_KEY = 'auth_tab_id';
  const AUTH_LAST_TAB_KEY = 'auth_last_tab';
  const AUTH_STATUS_UPDATED_KEY = 'auth_status_updated';
  const DEBOUNCE_INTERVAL = 2000; // 2 seconds debounce
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  // Helper function to update the cache and broadcast changes
  const updateAuthCache = (user, requiresTwoFactor) => {
    if (user) {
      const cacheData = {
        user,
        requiresTwoFactor
      };
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(AUTH_CACHE_EXPIRY, (Date.now() + CACHE_DURATION).toString());
    } else {
      localStorage.removeItem(AUTH_CACHE_KEY);
      localStorage.removeItem(AUTH_CACHE_EXPIRY);
    }

    // Broadcast a message to other tabs that authentication status has changed
    localStorage.setItem(AUTH_STATUS_UPDATED_KEY, Date.now().toString());
  };

  // Check if user is logged in on initial load
  useEffect(() => {

    // Generate a unique ID for this tab
    const generateTabId = () => {
      return Date.now().toString() + Math.random().toString(36).substring(2);
    };

    // Set a unique ID for this tab
    const tabId = generateTabId();
    localStorage.setItem(AUTH_TAB_ID_KEY, tabId);

    // Check if this is a new tab by comparing with the last active tab
    const lastTabId = localStorage.getItem(AUTH_LAST_TAB_KEY);
    const isNewTab = lastTabId !== tabId;

    // Update the last active tab
    localStorage.setItem(AUTH_LAST_TAB_KEY, tabId);

    const checkAuthStatus = async (forceCheck = false) => {
      try {
        // Implement debouncing to prevent excessive API calls
        const lastCallTimestamp = localStorage.getItem(AUTH_DEBOUNCE_KEY);
        const now = Date.now();

        if (!forceCheck && lastCallTimestamp && now - parseInt(lastCallTimestamp) < DEBOUNCE_INTERVAL) {
          console.log('Auth status check debounced, skipping');
          // Still set loading to false to avoid UI being stuck in loading state
          setLoading(false);
          return;
        }

        // Update the debounce timestamp
        localStorage.setItem(AUTH_DEBOUNCE_KEY, now.toString());

        // Check if we have a cached auth status that's still valid
        const cachedAuth = localStorage.getItem(AUTH_CACHE_KEY);
        const cacheExpiry = localStorage.getItem(AUTH_CACHE_EXPIRY);

        // If we have a valid cache and not forcing a check, use it
        if (!forceCheck && cachedAuth && cacheExpiry && now < parseInt(cacheExpiry)) {
          console.log('Using cached auth status');
          const cachedData = JSON.parse(cachedAuth);

          // Check if the cached data has the new format (with requiresTwoFactor)
          if (cachedData.user) {
            setCurrentUser(cachedData.user);
            setRequiresTwoFactor(cachedData.requiresTwoFactor || false);
          } else {
            // Backward compatibility for old cache format
            setCurrentUser(cachedData);
            setRequiresTwoFactor(false);
          }

          setLoading(false);
          return;
        }

        // No valid cache or forcing a check, make the API call
        console.log('Making API call to check auth status');

        // Check authentication status
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased timeout to 30 seconds to give users more time to enter 2FA code

        const response = await fetch('/api/users/status', {
          credentials: 'include',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);

          // Set requiresTwoFactor flag based on server response
          if (data.requiresTwoFactor) {
            setRequiresTwoFactor(true);
          } else {
            setRequiresTwoFactor(false);
          }

          // Cache the auth status
          if (data.user) {
            updateAuthCache(data.user, data.requiresTwoFactor || false);
          } else {
            updateAuthCache(null, false);
          }
        }
      } catch (err) {
        // Handle different types of connection errors
        if (err.name === 'AbortError') {
          console.warn('Auth status check timed out. Server might be unavailable.');
          setError('Server connection timed out. If you are trying to enter a 2FA code, please try again and enter it quickly after logging in.');
        } else if (err.message && err.message.includes('ECONNREFUSED')) {
          console.warn('Backend server is not running:', err);
          setError('Cannot connect to the server. Please make sure the backend server is running by executing "npm run dev:server" in a separate terminal.');
        } else {
          console.error('Error checking auth status:', err);
          setError('Failed to authenticate user');
        }
      } finally {
        setLoading(false);
      }
    };

    // If this is a new tab, force a check with the server
    checkAuthStatus(isNewTab);

    // Set up an interval to periodically check auth status
    const intervalId = setInterval(() => {
      checkAuthStatus(true);
    }, CACHE_DURATION);

    // Listen for storage events to detect changes in other tabs
    const handleStorageChange = (event) => {
      if (event.key === AUTH_STATUS_UPDATED_KEY) {
        console.log('Auth status updated in another tab, refreshing');
        checkAuthStatus(true);
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
      // Login API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for login

      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, rememberMe }),
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();

      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true);

        // Update the cache with the latest authentication status
        updateAuthCache(data.user, true);

        return { requiresTwoFactor: true, userId: data.user._id };
      }

      setCurrentUser(data.user);

      // Update the cache with the latest authentication status
      updateAuthCache(data.user, false);

      return data.user;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn('Login request timed out. Server might be unavailable.');
        const timeoutError = 'Server connection timed out. Please try again later.';
        setError(timeoutError);
        throw new Error(timeoutError);
      } else if (err.message && err.message.includes('ECONNREFUSED')) {
        const serverError = 'Cannot connect to the server. Please make sure the backend server is running by executing "npm run dev:server" in a separate terminal.';
        setError(serverError);
        throw new Error(serverError);
      } else {
        setError(err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify 2FA token during login
  const verifyTwoFactor = async (token, useBackupCode = false) => {
    setLoading(true);
    setError(null);

    try {
      // Verify 2FA API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for 2FA verification

      const response = await fetch('/api/2fa/verify-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, useBackupCode }),
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      const data = await response.json();
      setCurrentUser(data.user);
      setRequiresTwoFactor(false);

      // Update the cache with the latest authentication status
      updateAuthCache(data.user, false);

      return data.user;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn('2FA verification timed out. Server might be unavailable.');
        const timeoutError = 'Server connection timed out. Please try again later.';
        setError(timeoutError);
        throw new Error(timeoutError);
      } else if (err.message && err.message.includes('ECONNREFUSED')) {
        const serverError = 'Cannot connect to the server. Please make sure the backend server is running by executing "npm run dev:server" in a separate terminal.';
        setError(serverError);
        throw new Error(serverError);
      } else {
        setError(err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);

    try {
      // Logout API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for logout (shorter since it's a simpler operation)

      await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      setCurrentUser(null);
      setRequiresTwoFactor(false);

      // Clear the cache and broadcast a message to other tabs
      updateAuthCache(null, false);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn('Logout request timed out. Server might be unavailable.');
        const timeoutError = 'Server connection timed out during logout. Your session may still be active.';
        setError(timeoutError);
        console.error('Logout timeout error:', err);
      } else if (err.message && err.message.includes('ECONNREFUSED')) {
        const serverError = 'Cannot connect to the server. Please make sure the backend server is running by executing "npm run dev:server" in a separate terminal.';
        setError(serverError);
        console.error('Logout error (server not running):', err);
      } else {
        setError('Failed to logout');
        console.error('Logout error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      // Register API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for registration

      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData),
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      setCurrentUser(data.user);
      return data.user;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn('Registration request timed out. Server might be unavailable.');
        const timeoutError = 'Server connection timed out. Please try again later.';
        setError(timeoutError);
        throw new Error(timeoutError);
      } else if (err.message && err.message.includes('ECONNREFUSED')) {
        const serverError = 'Cannot connect to the server. Please make sure the backend server is running by executing "npm run dev:server" in a separate terminal.';
        setError(serverError);
        throw new Error(serverError);
      } else {
        setError(err.message);
        throw err;
      }
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
    requiresTwoFactor,
    isAuthenticated: !!currentUser && (!currentUser?.isTwoFactorEnabled || !requiresTwoFactor)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
