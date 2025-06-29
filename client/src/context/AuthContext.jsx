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
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  // Check if user is logged in on initial load
  useEffect(() => {
    // Add a cache mechanism to prevent excessive API calls
    const AUTH_CACHE_KEY = 'auth_status_cache';
    const AUTH_CACHE_EXPIRY = 'auth_cache_expiry';
    const AUTH_DEBOUNCE_KEY = 'auth_debounce_timestamp';
    const DEBOUNCE_INTERVAL = 2000; // 2 seconds debounce

    const checkAuthStatus = async () => {
      try {
        // Implement debouncing to prevent excessive API calls
        const lastCallTimestamp = localStorage.getItem(AUTH_DEBOUNCE_KEY);
        const now = Date.now();

        if (lastCallTimestamp && now - parseInt(lastCallTimestamp) < DEBOUNCE_INTERVAL) {
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

        // If we have a valid cache, use it
        if (cachedAuth && cacheExpiry && now < parseInt(cacheExpiry)) {
          console.log('Using cached auth status');
          const cachedUser = JSON.parse(cachedAuth);
          setCurrentUser(cachedUser);
          setLoading(false);
          return;
        }

        // No valid cache, make the API call
        console.log('No valid auth cache, making API call');

        // Check authentication status
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('/api/users/status', {
          credentials: 'include',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);

          // Cache the auth status for 5 minutes
          if (data.user) {
            localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(data.user));
            localStorage.setItem(AUTH_CACHE_EXPIRY, (Date.now() + 5 * 60 * 1000).toString());
          } else {
            // Clear cache if user is not authenticated
            localStorage.removeItem(AUTH_CACHE_KEY);
            localStorage.removeItem(AUTH_CACHE_EXPIRY);
          }
        }
      } catch (err) {
        // Handle different types of connection errors
        if (err.name === 'AbortError') {
          console.warn('Auth status check timed out. Server might be unavailable.');
          setError('Server connection timed out. Please try again later.');
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

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (username, password, rememberMe = false) => {
    setLoading(true);
    setError(null);
    setRequiresTwoFactor(false);

    try {
      // Login API call
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, rememberMe }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();

      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        return { requiresTwoFactor: true, userId: data.user._id };
      }

      setCurrentUser(data.user);
      return data.user;
    } catch (err) {
      if (err.message && err.message.includes('ECONNREFUSED')) {
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
      const response = await fetch('/api/2fa/verify-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, useBackupCode }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      const data = await response.json();
      setCurrentUser(data.user);
      setRequiresTwoFactor(false);
      return data.user;
    } catch (err) {
      if (err.message && err.message.includes('ECONNREFUSED')) {
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
      await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include'
      });

      setCurrentUser(null);
    } catch (err) {
      if (err.message && err.message.includes('ECONNREFUSED')) {
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
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      setCurrentUser(data.user);
      return data.user;
    } catch (err) {
      if (err.message && err.message.includes('ECONNREFUSED')) {
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
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
