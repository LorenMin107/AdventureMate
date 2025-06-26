import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CampgroundMap from '../components/maps/CampgroundMap';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
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

  // Fetch campground data
  useEffect(() => {
    const fetchCampground = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/campgrounds/${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch campground');
        }

        const data = await response.json();
        setCampground(data.campground);

        // Set reviews if available and properly populated
        if (data.campground && data.campground.reviews && Array.isArray(data.campground.reviews)) {
          // Check if reviews are populated with author information
          const areReviewsPopulated = data.campground.reviews.every(review => 
            review.author && typeof review.author === 'object' && review.author._id
          );

          if (areReviewsPopulated) {
            setReviews(data.campground.reviews);
          } else {
            // If reviews are not populated, fetch them separately
            fetchReviews(data.campground._id);
          }
        }
      } catch (err) {
        console.error('Error fetching campground:', err);
        setError('Failed to load campground. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampground();
  }, [id]);

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
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this campground?')) {
      return;
    }

    try {
      const response = await fetch(`/api/campgrounds/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete campground');
      }

      navigate('/campgrounds');
    } catch (err) {
      console.error('Error deleting campground:', err);
      alert('Failed to delete campground. Please try again later.');
    }
  };

  // Handle review submission
  const handleReviewSubmitted = (newReview) => {
    setReviews(prevReviews => [...prevReviews, newReview]);
  };

  // Handle review deletion
  const handleReviewDeleted = (reviewId) => {
    setReviews(prevReviews => prevReviews.filter(review => review._id !== reviewId));
  };

  // Fetch reviews separately if they're not properly populated
  const fetchReviews = async (campgroundId) => {
    try {
      const response = await fetch(`/api/campgrounds/${campgroundId}/reviews`);

      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status}`);
      }

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
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

  const { title, images, location: campLocation, description, price, author, geometry } = campground;

  // Check if current user is the author or an admin
  const isAuthorOrAdmin = currentUser && 
    (currentUser.isAdmin || (author && currentUser._id === author._id));

  return (
    <div className="campground-detail-page">
      <div className="campground-detail-header">
        <div className="header-content">
          <h1>{title}</h1>
          <p className="location">
            <i className="location-icon">📍</i> {campLocation}
          </p>
        </div>

        {isAuthorOrAdmin && (
          <div className="admin-actions">
            <Link to={`/campgrounds/${id}/edit`} className="edit-button">
              Edit
            </Link>
            <button onClick={handleDelete} className="delete-button">
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
          <div className={`map-section ${loading ? 'map-section-loading' : 'map-section-loaded'}`} ref={mapSectionRef}>
            <CampgroundMap 
              key={mapKey} // Force re-render when key changes
              geometry={geometry} 
              title={title} 
              popupContent={`<strong>${title}</strong><p>${campLocation}</p>`}
            />
          </div>
        )}
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
              <span className="detail-label">Price:</span>
              <span className="detail-value">${price} per night</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Hosted by:</span>
              <span className="detail-value">{author ? author.username : 'Unknown'}</span>
            </div>
          </div>

          <div className="booking-section">
            <div className="price-display">
              <span className="price">${price}</span>
              <span className="price-unit">night</span>
            </div>

            {currentUser ? (
              <Link to={`/bookings/${id}/book`} className="book-button">
                Book this campground
              </Link>
            ) : (
              <div className="login-to-book">
                <Link to={`/login?redirect=/campgrounds/${id}`} className="book-button">
                  Log in to book
                </Link>
                <p className="login-message">You need to be logged in to book a campground</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="reviews-section">
        <h2>Reviews</h2>
        <ReviewList 
          campgroundId={id} 
          initialReviews={reviews} 
          onReviewDeleted={handleReviewDeleted} 
        />
        <ReviewForm 
          campgroundId={id} 
          onReviewSubmitted={handleReviewSubmitted} 
        />
      </div>
    </div>
  );
};

export default CampgroundDetailPage;
