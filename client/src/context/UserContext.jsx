import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

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
      fetchUserDetails();
    } else {
      setUserDetails(null);
    }
  }, [isAuthenticated, currentUser?._id]);

  // Fetch detailed user data including reviews and bookings
  const fetchUserDetails = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users/profile', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      setUserDetails(data.user);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError(err.message || 'Failed to fetch user details');
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
      const response = await fetch('/api/users/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit contact form');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile (placeholder for future implementation)
  const updateProfile = async (profileData) => {
    if (!isAuthenticated) {
      throw new Error('You must be logged in to update your profile');
    }

    setLoading(true);
    setError(null);

    try {
      // This is a placeholder for a future API endpoint
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      setUserDetails(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
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
      console.log('Making API request to initiate 2FA setup...');
      console.log('Authentication status:', isAuthenticated);
      console.log('Current user:', currentUser);

      const response = await fetch('/api/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        throw new Error(errorData.error || 'Failed to initiate 2FA setup');
      }

      const data = await response.json();
      console.log('API response data:', { 
        qrCode: data.qrCode ? 'QR code data present' : 'No QR code data', 
        secret: data.secret ? 'Secret present' : 'No secret',
        setupCompleted: data.setupCompleted
      });

      return {
        qrCode: data.qrCode,
        secret: data.secret,
        setupCompleted: data.setupCompleted
      };
    } catch (err) {
      console.error('Error in initiate2FASetup:', err);
      setError(err.message);
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
      const response = await fetch('/api/2fa/verify-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify 2FA setup');
      }

      const data = await response.json();

      // Update user details with 2FA enabled
      await fetchUserDetails();

      return {
        backupCodes: data.backupCodes,
        setupCompleted: data.setupCompleted
      };
    } catch (err) {
      setError(err.message);
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
      const response = await fetch('/api/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disable 2FA');
      }

      // Update user details with 2FA disabled
      await fetchUserDetails();

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Generate new backup codes
  const generateNewBackupCodes = async (token) => {
    if (!isAuthenticated) {
      throw new Error('You must be logged in to generate new backup codes');
    }

    // Not setting loading state for 2FA operations since the component has its own loading state
    setError(null);

    try {
      const response = await fetch('/api/2fa/backup-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate new backup codes');
      }

      const data = await response.json();

      return {
        backupCodes: data.backupCodes
      };
    } catch (err) {
      setError(err.message);
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
    initiate2FASetup,
    verify2FASetup,
    disable2FA,
    generateNewBackupCodes,
    hasBookings: userDetails?.bookings?.length > 0,
    hasReviews: userDetails?.reviews?.length > 0
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
