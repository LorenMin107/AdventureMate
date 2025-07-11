import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../utils/api';
import EmailVerificationRequired from './EmailVerificationRequired';
import TwoFactorVerification from './TwoFactorVerification';

/**
 * Owner Protected Route component
 * Redirects to login page if user is not authenticated
 * Redirects to owner registration if user is not an owner
 * Checks owner verification status and permissions
 *
 * @param {Object} props - Component props
 * @param {boolean} props.requireVerified - Whether the route requires verified owner status (default: true)
 * @param {boolean} props.requireEmailVerified - Whether the route requires email verification (default: true)
 */
const OwnerProtectedRoute = ({ requireVerified = true, requireEmailVerified = true }) => {
  const { currentUser, loading, isAuthenticated, requiresTwoFactor } = useAuth();

  // Fetch owner profile if user is authenticated
  const {
    data: ownerProfile,
    isLoading: ownerLoading,
    error: ownerError,
  } = useQuery({
    queryKey: ['owner', 'profile'],
    queryFn: async () => {
      const { data } = await apiClient.get('/owners/profile');
      return data.owner;
    },
    enabled: isAuthenticated && !!currentUser,
    retry: false,
  });

  // Show loading state while checking authentication or owner status
  if (loading || ownerLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // If user has logged in but needs to complete 2FA verification
    if (currentUser && requiresTwoFactor) {
      return <TwoFactorVerification userId={currentUser._id} />;
    }
    return <Navigate to="/login" replace />;
  }

  // If email verification is required but user's email is not verified, show verification required page
  if (requireEmailVerified && !currentUser?.isEmailVerified) {
    return <EmailVerificationRequired />;
  }

  // If owner profile doesn't exist (user is not registered as owner), redirect to owner registration
  if (ownerError?.response?.status === 404 || !ownerProfile) {
    // If the user has isOwner flag but no profile, they were assigned as owner by admin
    // Redirect them to create their profile instead of the registration page
    if (currentUser?.isOwner) {
      return <Navigate to="/owner/create-profile" replace />;
    }
    return <Navigate to="/owner/register" replace />;
  }

  // If there's an error fetching owner profile (other than 404), show error
  if (ownerError && ownerError.response?.status !== 404) {
    return (
      <div className="error-container">
        <h2>Error Loading Owner Profile</h2>
        <p>There was an error loading your owner profile. Please try again later.</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // If verified owner status is required but owner is not verified
  if (requireVerified && ownerProfile?.verificationStatus !== 'verified') {
    return (
      <div className="owner-verification-required">
        <div className="verification-status-container">
          <h2>Owner Verification Required</h2>
          <div className="verification-status">
            <span className={`status-badge status-${ownerProfile?.verificationStatus}`}>
              {ownerProfile?.verificationStatusDisplay || 'Unknown Status'}
            </span>
          </div>

          {ownerProfile?.verificationStatus === 'pending' && (
            <div className="verification-message">
              <p>
                Your owner account is pending verification. Please upload the required documents to
                complete the verification process.
              </p>
              <Navigate to="/owner/verification" replace />
            </div>
          )}

          {ownerProfile?.verificationStatus === 'under_review' && (
            <div className="verification-message">
              <p>
                Your verification documents are currently under review. We'll notify you once the
                review is complete.
              </p>
              <p>This process typically takes 1-3 business days.</p>
            </div>
          )}

          {ownerProfile?.verificationStatus === 'rejected' && (
            <div className="verification-message">
              <p>
                Your verification was rejected. Please review the feedback and resubmit your
                documents.
              </p>
              <Navigate to="/owner/verification" replace />
            </div>
          )}

          {ownerProfile?.verificationStatus === 'suspended' && (
            <div className="verification-message">
              <p>Your owner account has been suspended. Please contact support for assistance.</p>
              <a href="mailto:support@myancamp.com" className="support-link">
                Contact Support
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If owner account is not active
  if (!ownerProfile?.isActive) {
    return (
      <div className="owner-account-suspended">
        <h2>Account Suspended</h2>
        <p>Your owner account has been suspended. Please contact support for assistance.</p>
        <a href="mailto:support@myancamp.com" className="support-link">
          Contact Support
        </a>
      </div>
    );
  }

  // If authenticated and passes all checks, render the child routes
  return <Outlet context={{ ownerProfile }} />;
};

export default OwnerProtectedRoute;
