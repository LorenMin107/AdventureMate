import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import apiClient from '../utils/api';
import { logInfo, logDebug, logError } from '../utils/logger';

// Create the context
const UserContext = createContext();

/**
 * Custom hook to use the user context
 * @returns {Object} The user context value
 */
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

/**
 * User provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const UserProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user details when the user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser?._id) {
      logInfo('User authenticated, fetching details');
      fetchUserDetails();
    } else {
      logInfo('User not authenticated, clearing details');
      setUserDetails(null);
    }
  }, [isAuthenticated, currentUser?._id]);

  // Listen for auth state changes to force refresh
  useEffect(() => {
    const handleAuthStateChange = (event) => {
      if (event.detail && event.detail.isAuthenticated && currentUser?._id) {
        logInfo('Auth state change detected, refreshing user details');
        fetchUserDetails();
      }
    };

    window.addEventListener('authStateChange', handleAuthStateChange);
    return () => {
      window.removeEventListener('authStateChange', handleAuthStateChange);
    };
  }, [currentUser?._id]);

  // Fetch detailed user data including reviews and bookings
  const fetchUserDetails = async () => {
    if (!isAuthenticated) {
      logInfo('fetchUserDetails called but user not authenticated');
      return;
    }

    logInfo('Fetching user details');
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/users/profile');
      logInfo('User details received');
      setUserDetails(response.data.user);
    } catch (err) {
      logError('Error fetching user details', err);
      logError('Error fetching user details', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  // Submit a contact form
  const submitContact = async (message) => {
    if (!isAuthenticated) {
      throw new Error('You must be logged in to submit a contact form');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/users/contact', { message });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit contact form');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (profileData, headers = {}) => {
    logInfo('updateProfile called');

    if (!isAuthenticated) {
      throw new Error('You must be logged in to update your profile');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.put('/users/profile', profileData, { headers });
      const updatedUser = response.data.user;

      // Update both UserContext and AuthContext
      setUserDetails(updatedUser);

      // Update AuthContext's currentUser if it exists
      if (currentUser) {
        // Create a new currentUser object with updated fields
        const updatedCurrentUser = {
          ...currentUser,
          username: updatedUser.username,
          profile: updatedUser.profile,
        };

        logInfo('Dispatching userProfileUpdated event');

        // Dispatch an event to notify AuthContext to update
        const event = new CustomEvent('userProfileUpdated', {
          detail: { updatedUser: updatedCurrentUser },
        });
        window.dispatchEvent(event);
      }

      return { success: true, user: updatedUser };
    } catch (err) {

      // Don't set the global error state for validation errors
      // Let the component handle them locally
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update profile';

      const result = {
        success: false,
        error: err.response?.data || err.message,
        message: errorMessage,
      };

      return result;
    } finally {
      setLoading(false);
    }
  };

  // 2FA Setup Methods

  // Initiate 2FA setup
  const initiate2FASetup = async () => {
    if (!isAuthenticated) {
      throw new Error('You must be logged in to set up 2FA');
    }

    // Not setting loading state for 2FA operations since the component has its own loading state
    setError(null);

    try {
      const response = await apiClient.post('/2fa/setup');

      return {
        qrCode: response.data.qrCode,
        secret: response.data.secret,
        setupCompleted: response.data.setupCompleted,
      };
    } catch (err) {
      logError('Error in initiate2FASetup', err);
      setError(err.response?.data?.message || err.message || 'Failed to initiate 2FA setup');
      throw err;
    }
  };

  // Verify 2FA setup
  const verify2FASetup = async (token) => {
    if (!isAuthenticated) {
      throw new Error('You must be logged in to verify 2FA setup');
    }

    // Not setting loading state for 2FA operations since the component has its own loading state
    setError(null);

    try {
      const response = await apiClient.post('/2fa/verify-setup', { token });

      // Update user details with 2FA enabled
      await fetchUserDetails();

      return {
        backupCodes: response.data.backupCodes,
        setupCompleted: response.data.setupCompleted,
      };
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to verify 2FA setup');
      throw err;
    }
  };

  // Disable 2FA
  const disable2FA = async (token) => {
    if (!isAuthenticated) {
      throw new Error('You must be logged in to disable 2FA');
    }

    // Not setting loading state for 2FA operations since the component has its own loading state
    setError(null);

    try {
      await apiClient.post('/2fa/disable', { token });

      // Update user details with 2FA disabled
      await fetchUserDetails();

      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to disable 2FA');
      throw err;
    }
  };

  // Context value
  const value = {
    userDetails,
    loading,
    error,
    fetchUserDetails,
    submitContact,
    updateProfile,
    setUserDetails,
    initiate2FASetup,
    verify2FASetup,
    disable2FA,
    hasBookings: userDetails?.bookings?.length > 0,
    hasReviews: userDetails?.reviews?.length > 0,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
