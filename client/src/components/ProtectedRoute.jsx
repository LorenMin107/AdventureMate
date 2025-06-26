import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protected Route component
 * Redirects to login page if user is not authenticated
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.requireAdmin - Whether the route requires admin privileges
 */
const ProtectedRoute = ({ requireAdmin = false }) => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If admin is required but user is not admin, redirect to home
  if (requireAdmin && !currentUser?.isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  // If authenticated and passes admin check, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;