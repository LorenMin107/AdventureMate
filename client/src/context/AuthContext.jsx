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

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
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
  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      // Login API call
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
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
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
