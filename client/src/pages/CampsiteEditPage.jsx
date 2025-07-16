import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import CampsiteForm from '../components/CampsiteForm';
import { logError } from '../utils/logger';
import './CampsiteNewPage.css'; // Reuse the same CSS

/**
 * CampsiteEditPage component for editing existing campsites
 * Only accessible to campground owners
 */
const CampsiteEditPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();

  const [campsite, setCampsite] = useState(null);
  const [campground, setCampground] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  // Fetch campsite data
  useEffect(() => {
    const fetchCampsite = async () => {
      if (!id) return;

      try {
        const response = await fetch(`/api/v1/campsites/${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch campsite');
        }

        const data = await response.json();

        // Check if the response is in the standardized format
        const campsiteData = data.status && data.data ? data.data.campsite : data.campsite;

        if (!campsiteData) {
          throw new Error('Campsite data not found in response');
        }

        setCampsite(campsiteData);

        // Fetch the parent campground to verify ownership
        if (campsiteData.campground) {
          const campgroundId =
            typeof campsiteData.campground === 'object'
              ? campsiteData.campground._id
              : campsiteData.campground;

          const campgroundResponse = await fetch(`/api/v1/campgrounds/${campgroundId}`);

          if (!campgroundResponse.ok) {
            throw new Error('Failed to fetch parent campground');
          }

          const campgroundData = await campgroundResponse.json();

          // Check if the response is in the standardized format
          const campgroundInfo =
            campgroundData.status && campgroundData.data
              ? campgroundData.data.campground
              : campgroundData.campground;

          if (!campgroundInfo) {
            throw new Error('Campground data not found in response');
          }

          setCampground(campgroundInfo);
        }
      } catch (err) {
        logError('Error fetching data', err);
        setError(t('campsiteEdit.errorLoading'));
      } finally {
        setLoadingData(false);
      }
    };

    fetchCampsite();
  }, [id]);

  // Check if user is the owner of the campground
  const isOwner =
    currentUser &&
    campground &&
    (currentUser.isAdmin ||
      (campground.owner && currentUser._id === campground.owner._id) ||
      (campground.author && currentUser._id === campground.author._id));

  // Redirect if not the owner
  useEffect(() => {
    if (!loading && !loadingData && !isOwner && campground) {
      navigate(`/campgrounds/${campground._id}`);
    }
  }, [currentUser, loading, loadingData, isOwner, navigate, campground]);

  if (loading || loadingData) {
    return <div className="loading-container">{t('campsiteEdit.loading')}</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!currentUser) {
    return <div className="unauthorized-container">{t('campsiteEdit.loginRequired')}</div>;
  }

  if (!isOwner) {
    return <div className="unauthorized-container">{t('campsiteEdit.noPermission')}</div>;
  }

  if (!campsite || !campground) {
    return <div className="error-container">{t('campsiteEdit.dataNotFound')}</div>;
  }

  return (
    <div className="campsite-new-page">
      <div className="page-header">
        <h1>{t('campsiteEdit.title')}</h1>
        <p>
          {t('campsiteEdit.subtitle', {
            campsiteName: campsite.name,
            campgroundTitle: campground.title,
          })}
        </p>
      </div>

      <CampsiteForm campgroundId={campground._id} campsite={campsite} isEditing={true} />
    </div>
  );
};

export default CampsiteEditPage;
