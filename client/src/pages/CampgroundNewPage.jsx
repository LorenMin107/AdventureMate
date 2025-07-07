import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CampgroundForm from '../components/CampgroundForm';
import './CampgroundNewPage.css';

/**
 * CampgroundNewPage component for creating a new campground
 * Only accessible to admin users
 */
const CampgroundNewPage = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!loading) setInitialLoad(false);
  }, [loading]);

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (!loading && currentUser && !currentUser.isAdmin) {
      navigate('/campgrounds');
    }
  }, [currentUser, loading, navigate]);

  if (initialLoad) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!currentUser) {
    return <div className="unauthorized-container">Please log in to access this page.</div>;
  }

  if (!currentUser.isAdmin) {
    return (
      <div className="unauthorized-container">You don't have permission to access this page.</div>
    );
  }

  return (
    <div className="campground-new-page">
      <div className="page-header">
        <h1>Create New Campground</h1>
        <p>Add a new campground to the database</p>
      </div>

      <CampgroundForm isEditing={false} />
    </div>
  );
};

export default CampgroundNewPage;
