import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CampsiteForm from '../components/CampsiteForm';
import { logError } from '../utils/logger';
import './CampsiteNewPage.css';

/**
 * CampsiteNewPage component for creating a new campsite within a campground
 * Only accessible to campground owners
 */
const CampsiteNewPage = () => {
  const { id: campgroundId } = useParams();
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  const [campground, setCampground] = useState(null);
  const [loadingCampground, setLoadingCampground] = useState(true);
  const [error, setError] = useState(null);

  // Fetch campground to verify ownership
  useEffect(() => {
    const fetchCampground = async () => {
      if (!campgroundId) return;

      try {
        const response = await fetch(`/api/v1/campgrounds/${campgroundId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch campground');
        }

        const data = await response.json();

        // Check if the response is in the standardized format
        const campgroundData = data.status && data.data ? data.data.campground : data.campground;

        if (!campgroundData) {
          throw new Error('Campground data not found in response');
        }

        setCampground(campgroundData);
      } catch (err) {
        logError('Error fetching campground', err);
        setError('Failed to load campground. Please try again later.');
      } finally {
        setLoadingCampground(false);
      }
    };

    fetchCampground();
  }, [campgroundId]);

  // Check if user is the owner of the campground
  const isOwner =
    currentUser &&
    campground &&
    (currentUser.isAdmin ||
      (campground.owner && currentUser._id === campground.owner._id) ||
      (campground.author && currentUser._id === campground.author._id));

  // Redirect if not the owner
  useEffect(() => {
    if (!loading && !loadingCampground && !isOwner) {
      navigate(`/campgrounds/${campgroundId}`);
    }
  }, [currentUser, loading, loadingCampground, isOwner, navigate, campgroundId]);

  if (loading || loadingCampground) {
    return <div className="loading-container">Loading...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!currentUser) {
    return <div className="unauthorized-container">Please log in to access this page.</div>;
  }

  if (!isOwner) {
    return (
      <div className="unauthorized-container">
        You don't have permission to add campsites to this campground.
      </div>
    );
  }

  return (
    <div className="campsite-new-page">
      <div className="page-header">
        <h1>Add New Campsite</h1>
        <p>Add a new campsite to {campground.title}</p>
      </div>

      <CampsiteForm campgroundId={campgroundId} isEditing={false} />
    </div>
  );
};

export default CampsiteNewPage;
