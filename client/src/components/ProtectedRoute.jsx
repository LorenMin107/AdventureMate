import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EmailVerificationRequired from './EmailVerificationRequired';
import TwoFactorVerification from './TwoFactorVerification';

/**
 * Protected Route component
 * Redirects to login page if user is not authenticated
 * Redirects to email verification page if user's email is not verified
 * Redirects to 2FA verification page if 2FA verification is required
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.requireAdmin - Whether the route requires admin privileges
 * @param {boolean} props.requireEmailVerified - Whether the route requires email verification (default: true)
 */
const ProtectedRoute = ({ requireAdmin = false, requireEmailVerified = true }) => {
  const { currentUser, loading, isAuthenticated, requiresTwoFactor } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // If user has logged in but needs to complete 2FA verification
    if (currentUser && requiresTwoFactor) {
      return <TwoFactorVerification userId={currentUser._id} />;
    }
    return <Navigate to="/login" replace />;
  }

  // If admin is required but user is not admin, redirect to home
  if (requireAdmin && !currentUser?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  // If email verification is required but user's email is not verified, show verification required page
  if (requireEmailVerified && !currentUser?.isEmailVerified) {
    return <EmailVerificationRequired />;
  }

  // If authenticated and passes all checks, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
