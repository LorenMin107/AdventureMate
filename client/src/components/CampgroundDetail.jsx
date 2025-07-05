import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';
import BookingForm from './BookingForm';
import apiClient from '../utils/api';
import './CampgroundDetail.css';

/**
 * CampgroundDetail component displays detailed information about a campground
 */
const CampgroundDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [campground, setCampground] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchCampground = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/campgrounds/${id}`);
        const data = response.data;
        setCampground(data.campground);
        if (data.campground && data.campground.reviews) {
          setReviews(data.campground.reviews);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching campground:', err);
        setError('Failed to load campground details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCampground();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this campground?')) {
      return;
    }

    try {
      await apiClient.delete(`/campgrounds/${id}`);

      navigate('/campgrounds');
    } catch (err) {
      console.error('Error deleting campground:', err);
      alert('Failed to delete campground. Please try again later.');
    }
  };

  const handleReviewSubmitted = (newReview) => {
    setReviews([...reviews, newReview]);
  };

  const handleReviewDeleted = (reviewId) => {
    setReviews(reviews.filter(review => review._id !== reviewId));
  };

  if (loading) {
    return <div className="campground-detail-loading">Loading campground details...</div>;
  }

  if (error) {
    return <div className="campground-detail-error">{error}</div>;
  }

  if (!campground) {
    return <div className="campground-detail-not-found">Campground not found</div>;
  }

  const { 
    title, 
    location, 
    description, 
    price, 
    images, 
    author
  } = campground;

  const isAuthor = currentUser && author && currentUser._id === author._id;
  const isAdmin = currentUser && currentUser.isAdmin;
  const canModify = isAuthor || isAdmin;

  // Get the active image or use a placeholder
  const activeImage = images && images.length > 0 
    ? images[activeImageIndex].url 
    : 'https://via.placeholder.com/800x600?text=No+Image+Available';

  return (
    <div className="campground-detail">
      <div className="campground-detail-header">
        <h1>{title}</h1>
        <p className="campground-detail-location">{location}</p>
      </div>

      <div className="campground-detail-content">
        <div className="campground-detail-gallery">
          <div className="campground-detail-main-image">
            <img src={activeImage} alt={title} />
          </div>

          {images && images.length > 1 && (
            <div className="campground-detail-thumbnails">
              {images.map((image, index) => (
                <div 
                  key={index}
                  className={`thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img src={image.url} alt={`${title} - image ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="campground-detail-info">
          <div className="campground-detail-description">
            <h2>About this campground</h2>
            <p>{description}</p>

            <div className="campground-detail-author">
              <p>Submitted by {author ? author.username : 'Unknown'}</p>
            </div>
          </div>

          <div className="campground-detail-booking">
            <div className="campground-detail-price">
              <h3>${price}<span>/night</span></h3>
            </div>

            <BookingForm campground={campground} />

            {canModify && (
              <div className="campground-detail-actions">
                <Link to={`/campgrounds/${id}/edit`} className="edit-button">
                  Edit
                </Link>
                <button onClick={handleDelete} className="delete-button">
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="campground-detail-reviews">
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

export default CampgroundDetail;
