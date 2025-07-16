import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import CampgroundForm from '../components/CampgroundForm';
import { logError } from '../utils/logger';
import './CampgroundNewPage.css'; // Reuse the same CSS

/**
 * CampgroundEditPage component for editing existing campgrounds
 * Only accessible to admin users or the campground author
 */
const CampgroundEditPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  const [campground, setCampground] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const fetchCampground = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/campgrounds/${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          // Check if the error response is in the new standardized format
          const errorMessage =
            errorData.status === 'error'
              ? errorData.error || errorData.message
              : `Failed to fetch campground: ${response.status}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Check if the response is in the new standardized format
        const campgroundData = data.status && data.data ? data.data.campground : data.campground;

        if (!campgroundData) {
          throw new Error('Campground data not found in response');
        }

        setCampground(campgroundData);

        // Check if user is authorized to edit this campground
        const isAdmin = currentUser?.isAdmin;
        const isAuthor = currentUser?._id === campgroundData.author?._id;

        if (!isAdmin && !isAuthor) {
          setUnauthorized(true);
        }
      } catch (err) {
        logError('Error fetching campground', err);
        setError(t('campgroundEdit.errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && id) {
      fetchCampground();
    } else if (!isAuthenticated) {
      navigate('/login');
    }
  }, [id, currentUser, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="campground-new-page">
        <div className="loading-container">{t('campgroundEdit.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="campground-new-page">
        <div className="unauthorized-container">
          <p>{error}</p>
          <Link to="/campgrounds" className="btn btn-primary">
            {t('campgroundEdit.backToCampgrounds')}
          </Link>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="campground-new-page">
        <div className="unauthorized-container">
          <p>{t('campgroundEdit.notAuthorized')}</p>
          <Link to={`/campgrounds/${id}`} className="btn btn-primary">
            {t('campgroundEdit.viewCampground')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="campground-new-page">
      <div className="page-header">
        <h1>{t('campgroundEdit.title')}</h1>
        <p>{t('campgroundEdit.subtitle', { campgroundTitle: campground?.title })}</p>
      </div>

      {campground && <CampgroundForm isEditing={true} campground={campground} />}
    </div>
  );
};

export default CampgroundEditPage;
