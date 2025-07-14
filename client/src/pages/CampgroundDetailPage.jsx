import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/api';
import CampgroundMap from '../components/maps/CampgroundMap';
import WeatherBox from '../components/WeatherBox';
import SafetyAlertList from '../components/SafetyAlertList';
import SafetyAlertForm from '../components/SafetyAlertForm';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import CampsiteList from '../components/CampsiteList';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { logError, logInfo } from '../utils/logger';
import './CampgroundDetailPage.css';

/**
 * CampgroundDetailPage displays detailed information about a single campground
 *
 * Note: Special handling has been added to ensure the map displays correctly when
 * navigating from the campgrounds page to a specific campground detail page:
 * 1. A unique key is generated for the map component when the location changes or campground data loads
 * 2. A ref is used to access the map section DOM element
 * 3. Multiple resize events are triggered at different times to ensure proper rendering
 * 4. requestAnimationFrame is used to ensure the DOM has been painted before resizing
 */
const CampgroundDetailPage = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mapSectionRef = useRef(null);

  const [campground, setCampground] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [mapKey, setMapKey] = useState(Date.now()); // Used to force re-render of the map
  const [reviews, setReviews] = useState([]);
  const [showSafetyAlertForm, setShowSafetyAlertForm] = useState(false);
  const [safetyAlertsKey, setSafetyAlertsKey] = useState(0);
  const [campsites, setCampsites] = useState([]);
  const [loadingCampsites, setLoadingCampsites] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    campground: null,
  });

  // Fetch campground data
  useEffect(() => {
    // Add a cache mechanism to prevent excessive API calls
    const CAMPGROUND_CACHE_KEY = `campground_${id}_cache`;
    const CAMPGROUND_CACHE_EXPIRY = `campground_${id}_cache_expiry`;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    const fetchCampground = async () => {
      setLoading(true);
      try {
        // Check if we have a cached campground data that's still valid
        const cachedCampground = localStorage.getItem(CAMPGROUND_CACHE_KEY);
        const cacheExpiry = localStorage.getItem(CAMPGROUND_CACHE_EXPIRY);

        // If we have a valid cache, use it
        if (cachedCampground && cacheExpiry && Date.now() < parseInt(cacheExpiry)) {
          logInfo('Using cached campground data', { id });
          const campgroundData = JSON.parse(cachedCampground);
          setCampground(campgroundData);

          // Set reviews if available and properly populated
          if (campgroundData.reviews && Array.isArray(campgroundData.reviews)) {
            // Check if reviews are populated with author information
            const areReviewsPopulated = campgroundData.reviews.every(
              (review) => review.author && typeof review.author === 'object' && review.author._id
            );

            if (areReviewsPopulated) {
              setReviews(campgroundData.reviews);
            } else {
              // If reviews are not populated, fetch them separately
              fetchReviews(campgroundData._id);
            }
          }

          setLoading(false);
          return;
        }

        // No valid cache, make the API call
        logInfo('No valid campground cache, making API call', { id });

        const response = await apiClient.get(`/campgrounds/${id}`);

        // With apiClient, the response is already parsed and in response.data
        const data = response.data;

        // Check if the response is in the new standardized format
        const campgroundData = data.status && data.data ? data.data.campground : data.campground;

        if (!campgroundData) {
          throw new Error('Campground data not found in response');
        }

        setCampground(campgroundData);

        // Cache the campground data
        localStorage.setItem(CAMPGROUND_CACHE_KEY, JSON.stringify(campgroundData));
        localStorage.setItem(CAMPGROUND_CACHE_EXPIRY, (Date.now() + CACHE_DURATION).toString());

        // Set reviews if available and properly populated
        if (campgroundData.reviews && Array.isArray(campgroundData.reviews)) {
          // Check if reviews are populated with author information
          const areReviewsPopulated = campgroundData.reviews.every(
            (review) => review.author && typeof review.author === 'object' && review.author._id
          );

          if (areReviewsPopulated) {
            setReviews(campgroundData.reviews);
          } else {
            // If reviews are not populated, fetch them separately
            fetchReviews(campgroundData._id);
          }
        }
      } catch (err) {
        logError('Error fetching campground', err);
        setError('Failed to load campground. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampground();
  }, [id]);

  // Fetch campsites data
  const fetchCampsites = async (campgroundId) => {
    // Add a cache mechanism to prevent excessive API calls
    const CAMPSITES_CACHE_KEY = `campsites_${campgroundId}_cache`;
    const CAMPSITES_CACHE_EXPIRY = `campsites_${campgroundId}_cache_expiry`;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    setLoadingCampsites(true);
    try {
      // Check if we have a cached campsites data that's still valid
      const cachedCampsites = localStorage.getItem(CAMPSITES_CACHE_KEY);
      const cacheExpiry = localStorage.getItem(CAMPSITES_CACHE_EXPIRY);

      // If we have a valid cache, use it
      if (cachedCampsites && cacheExpiry && Date.now() < parseInt(cacheExpiry)) {
        logInfo('Using cached campsites data', { campgroundId });
        const campsitesData = JSON.parse(cachedCampsites);
        setCampsites(campsitesData);
        setLoadingCampsites(false);
        return;
      }

      // No valid cache, make the API call
      logInfo('No valid campsites cache, making API call', { campgroundId });

      const response = await apiClient.get(`/campgrounds/${campgroundId}/campsites`);

      // With apiClient, the response is already parsed and in response.data
      const data = response.data;

      // Check if the response is in the standardized format
      const campsitesData = data.status && data.data ? data.data.campsites : data.campsites;

      if (!campsitesData) {
        throw new Error('Campsites data not found in response');
      }

      setCampsites(campsitesData);

      // Cache the campsites data
      localStorage.setItem(CAMPSITES_CACHE_KEY, JSON.stringify(campsitesData));
      localStorage.setItem(CAMPSITES_CACHE_EXPIRY, (Date.now() + CACHE_DURATION).toString());
    } catch (err) {
      logError('Error fetching campsites', err);
      // Don't set error state here, as we already have the campground data
    } finally {
      setLoadingCampsites(false);
    }
  };

  // Fetch campsites when campground data is loaded
  useEffect(() => {
    if (campground && campground._id) {
      fetchCampsites(campground._id);
    }
  }, [campground]);

  // Force map re-render when location changes or when campground data is loaded
  useEffect(() => {
    // Update the key to force a re-render of the map
    setMapKey(Date.now());
  }, [location.pathname, campground]);

  // Ensure map resizes correctly when the component is fully rendered
  useEffect(() => {
    if (!loading && campground && mapSectionRef.current) {
      let finalResizeTimer;
      let secondResizeTimer;
      let thirdResizeTimer;

      // Use requestAnimationFrame to ensure the DOM has been painted
      const rafId = requestAnimationFrame(() => {
        // Dispatch a resize event to trigger map resize
        window.dispatchEvent(new Event('resize'));

        // Additional resize after a delay to catch any late layout shifts
        finalResizeTimer = setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 500);

        // Second additional resize with a longer delay
        secondResizeTimer = setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 1000);

        // Third additional resize with an even longer delay
        thirdResizeTimer = setTimeout(() => {
          window.dispatchEvent(new Event('resize'));

          // Force a style recalculation on the map section to ensure proper rendering
          if (mapSectionRef.current) {
            // Force a reflow
            const height = mapSectionRef.current.offsetHeight;
            // Apply a small style change and revert it to trigger a repaint
            mapSectionRef.current.style.opacity = '0.99';
            setTimeout(() => {
              mapSectionRef.current.style.opacity = '1';
              window.dispatchEvent(new Event('resize'));
            }, 0);
          }
        }, 1500);
      });

      // Proper cleanup function for the effect
      return () => {
        cancelAnimationFrame(rafId);
        if (finalResizeTimer) {
          clearTimeout(finalResizeTimer);
        }
        if (secondResizeTimer) {
          clearTimeout(secondResizeTimer);
        }
        if (thirdResizeTimer) {
          clearTimeout(thirdResizeTimer);
        }
      };
    }
  }, [loading, campground]);

  // Handle campground deletion
  const handleDeleteClick = () => {
    setDeleteDialog({
      open: true,
      campground,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await apiClient.delete(`/campgrounds/${id}`);

      // Log the response data
      logInfo('Delete response', response.data);

      navigate('/campgrounds');
    } catch (err) {
      logError('Error deleting campground', err);
      alert(err.response?.data?.message || 'Failed to delete campground. Please try again later.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, campground: null });
  };

  // Handle review submission
  const handleReviewSubmitted = (newReview) => {
    // Update reviews state
    const updatedReviews = [...reviews, newReview];
    setReviews(updatedReviews);

    // Update reviews cache
    if (campground && campground._id) {
      const REVIEWS_CACHE_KEY = `reviews_${campground._id}_cache`;
      const REVIEWS_CACHE_EXPIRY = `reviews_${campground._id}_cache_expiry`;
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

      localStorage.setItem(REVIEWS_CACHE_KEY, JSON.stringify(updatedReviews));
      localStorage.setItem(REVIEWS_CACHE_EXPIRY, (Date.now() + CACHE_DURATION).toString());

      logInfo('Updated reviews cache after adding review', { campgroundId: campground._id });
    }
  };

  // Handle review deletion
  const handleReviewDeleted = (reviewId) => {
    // Update reviews state
    const updatedReviews = reviews.filter((review) => review._id !== reviewId);
    setReviews(updatedReviews);

    // Update reviews cache
    if (campground && campground._id) {
      const REVIEWS_CACHE_KEY = `reviews_${campground._id}_cache`;
      const REVIEWS_CACHE_EXPIRY = `reviews_${campground._id}_cache_expiry`;
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

      localStorage.setItem(REVIEWS_CACHE_KEY, JSON.stringify(updatedReviews));
      localStorage.setItem(REVIEWS_CACHE_EXPIRY, (Date.now() + CACHE_DURATION).toString());

      logInfo('Updated reviews cache after deleting review', { campgroundId: campground._id });
    }
  };

  // Fetch reviews separately if they're not properly populated
  const fetchReviews = async (campgroundId) => {
    // Add a cache mechanism to prevent excessive API calls
    const REVIEWS_CACHE_KEY = `reviews_${campgroundId}_cache`;
    const REVIEWS_CACHE_EXPIRY = `reviews_${campgroundId}_cache_expiry`;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    try {
      // Check if we have a cached reviews data that's still valid
      const cachedReviews = localStorage.getItem(REVIEWS_CACHE_KEY);
      const cacheExpiry = localStorage.getItem(REVIEWS_CACHE_EXPIRY);

      // If we have a valid cache, use it
      if (cachedReviews && cacheExpiry && Date.now() < parseInt(cacheExpiry)) {
        logInfo('Using cached reviews data', { campgroundId });
        const reviewsData = JSON.parse(cachedReviews);
        setReviews(reviewsData);
        return;
      }

      // No valid cache, make the API call
      logInfo('No valid reviews cache, making API call', { campgroundId });

      const response = await apiClient.get(`/campgrounds/${campgroundId}/reviews`);

      // With apiClient, the response is already parsed and in response.data
      const data = response.data;

      // Check if the response is in the new standardized format
      const responseData = data.status && data.data ? data.data : data;
      const reviewsData = responseData.reviews || [];

      setReviews(reviewsData);

      // Cache the reviews data
      localStorage.setItem(REVIEWS_CACHE_KEY, JSON.stringify(reviewsData));
      localStorage.setItem(REVIEWS_CACHE_EXPIRY, (Date.now() + CACHE_DURATION).toString());
    } catch (err) {
      logError('Error fetching reviews', err);
      // Don't set error state here, as we already have the campground data
    }
  };

  if (loading) {
    return <div className="loading-container">Loading campground details...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!campground) {
    return <div className="not-found-container">Campground not found</div>;
  }

  const { title, images, location: campLocation, description, author, geometry } = campground;

  // Calculate the starting price from available campsites
  const getStartingPrice = () => {
    if (campsites.length === 0) {
      // If no campsites, return 0
      return 0;
    }

    // Filter available campsites
    const availableCampsites = campsites.filter((campsite) => campsite.availability);

    if (availableCampsites.length === 0) {
      // If no available campsites, return 0
      return 0;
    }

    // Find the minimum price among available campsites
    return Math.min(...availableCampsites.map((campsite) => campsite.price));
  };

  const startingPrice = getStartingPrice();

  // Check if current user is the owner, author, or an admin
  const isOwner =
    currentUser &&
    (currentUser.isAdmin ||
      (campground.owner && currentUser._id === campground.owner._id) ||
      (author && currentUser._id === author._id));

  // For backward compatibility, if there's no explicit owner, the author is considered the owner
  const effectiveOwner = campground.owner ? campground.owner : author;

  return (
    <div className="campground-detail-page">
      <div className="campground-detail-header">
        <div className="header-content">
          <h1>{title}</h1>
          <p className="location">
            <i className="location-icon">📍</i> {campLocation}
          </p>
        </div>

        {isOwner && (
          <div className="admin-actions">
            <Link to={`/campgrounds/${id}/edit`} className="common-btn common-btn-secondary">
              Edit
            </Link>
            <button onClick={handleDeleteClick} className="common-btn common-btn-danger">
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="campground-media-container">
        <div className="campground-images">
          {images && images.length > 0 ? (
            <>
              <div className="main-image">
                <img
                  src={images[activeImageIndex].url}
                  alt={`${title} - Image ${activeImageIndex + 1}`}
                />
              </div>

              {images.length > 1 && (
                <div className="image-thumbnails">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={`thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                      onClick={() => setActiveImageIndex(index)}
                    >
                      <img src={image.url} alt={`${title} - Thumbnail ${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="no-image">
              <p>No images available</p>
            </div>
          )}
        </div>

        {geometry && geometry.coordinates && (
          <div
            className={`map-section ${loading ? 'map-section-loading' : 'map-section-loaded'}`}
            ref={mapSectionRef}
          >
            <CampgroundMap
              key={mapKey} // Force re-render when key changes
              geometry={geometry}
              title={title}
              enablePopup={false}
            />
          </div>
        )}
      </div>

      {/* Weather Section - moved outside the media container */}
      {geometry && geometry.coordinates && (
        <div className="weather-section">
          <h2>Weather Forecast for this Campground</h2>
          <WeatherBox
            lat={geometry.coordinates[1]}
            lng={geometry.coordinates[0]}
            showForecast={true}
            compact={false}
          />
        </div>
      )}

      {/* Safety Alerts Section */}
      <div className="safety-alerts-section">
        <div className="safety-alerts-header">
          <h2>Safety Alerts</h2>
          {isOwner && (
            <button
              onClick={() => setShowSafetyAlertForm(!showSafetyAlertForm)}
              className="create-alert-button"
            >
              {showSafetyAlertForm ? 'Cancel' : 'Create Alert'}
            </button>
          )}
        </div>

        {showSafetyAlertForm && (
          <SafetyAlertForm
            entityId={id}
            entityType="campground"
            onAlertSubmitted={(newAlert) => {
              setShowSafetyAlertForm(false);
              // Force a refresh of the safety alerts list by changing the key
              setSafetyAlertsKey((prev) => prev + 1);
            }}
            onCancel={() => setShowSafetyAlertForm(false)}
          />
        )}

        <SafetyAlertList
          key={safetyAlertsKey}
          entityId={id}
          entityType="campground"
          showActiveOnly={false}
          showAllForAcknowledgment={true}
          onAlertDeleted={(alertId) => {
            // Force a refresh of the safety alerts list by changing the key
            setSafetyAlertsKey((prev) => prev + 1);
          }}
          onAlertAcknowledged={() => {
            // Force a refresh of the safety alerts list by changing the key
            setSafetyAlertsKey((prev) => prev + 1);
          }}
        />
      </div>

      <div className="campground-info-container">
        <div className="campground-info">
          <div className="info-section">
            <h2>About this campground</h2>
            <p className="description">{description}</p>
          </div>

          <div className="info-section">
            <h2>Details</h2>
            <div className="detail-item">
              <span className="detail-label">Hosted by:</span>
              <span className="detail-value">{author ? author.username : 'Unknown'}</span>
            </div>
          </div>

          <div className="booking-section">
            <div className="price-display">
              <span className="price">${startingPrice}</span>
              <span className="price-unit">starting price per night</span>
            </div>

            {!currentUser && (
              <div className="login-to-book">
                <Link
                  to={`/login?redirect=/campgrounds/${id}`}
                  className="common-btn common-btn-primary"
                >
                  Log in to book
                </Link>
                <p className="login-message">You need to be logged in to book a campsite</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campsites Section */}
      <CampsiteList campgroundId={id} isOwner={isOwner} />

      {/* Reviews Section */}
      <div className="reviews-section">
        <h2>Reviews</h2>
        <ReviewList
          campgroundId={id}
          initialReviews={reviews}
          onReviewDeleted={handleReviewDeleted}
        />
        <ReviewForm campgroundId={id} onReviewSubmitted={handleReviewSubmitted} />
      </div>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Campground"
        message={`Are you sure you want to delete "${deleteDialog.campground?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default CampgroundDetailPage;
