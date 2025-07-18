import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import CampsiteForm from '../components/CampsiteForm';
import apiClient from '../utils/api';
import { logError } from '../utils/logger';
import './CampsiteNewPage.css';

/**
 * CampsiteNewPage component for creating a new campsite within a campground
 * Only accessible to campground owners
 */
const CampsiteNewPage = () => {
  const { t } = useTranslation();
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
        const response = await apiClient.get(`/campgrounds/${campgroundId}`);

        // Handle the ApiResponse format
        const responseData = response.data;
        const data = responseData.data || responseData; // Handle both ApiResponse format and direct data
        const campgroundData = data.campground;

        if (!campgroundData) {
          throw new Error('Campground data not found in response');
        }

        setCampground(campgroundData);
      } catch (err) {
        logError('Error fetching campground', err);
        setError(t('commonErrors.failedToLoad', { item: 'campground' }));
      } finally {
        setLoadingCampground(false);
      }
    };

    fetchCampground();
  }, [campgroundId, t]);

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
    return <div className="loading-container">{t('campsiteNew.loading')}</div>;
  }

  if (error) {
    return <div className="error-container">{t('campsiteNew.errorLoading')}</div>;
  }

  if (!currentUser) {
    return <div className="unauthorized-container">{t('campsiteNew.loginRequired')}</div>;
  }

  if (!isOwner) {
    return <div className="unauthorized-container">{t('campsiteNew.noPermission')}</div>;
  }

  return (
    <div className="campsite-new-page">
      <div className="page-header">
        <h1>{t('campsiteNew.title')}</h1>
        <p>{t('campsiteNew.subtitle', { campgroundTitle: campground.title })}</p>
      </div>

      <CampsiteForm campgroundId={campgroundId} isEditing={false} />
    </div>
  );
};

export default CampsiteNewPage;
