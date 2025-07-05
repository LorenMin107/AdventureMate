import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';
import apiClient from '../utils/api';
import { logError, logInfo } from '../utils/logger';
import './ReviewList.css';

/**
 * ReviewList component displays a list of reviews for a campground
 *
 * @param {Object} props - Component props
 * @param {string} props.campgroundId - ID of the campground
 * @param {Array} props.initialReviews - Initial reviews data (optional)
 * @param {function} props.onReviewDeleted - Callback when a review is deleted (optional)
 * @returns {JSX.Element} Review list component
 */
const ReviewList = ({ campgroundId, initialReviews = [], onReviewDeleted }) => {
  const [reviews, setReviews] = useState(initialReviews);
  const [loading, setLoading] = useState(!initialReviews.length);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    // If we have initial reviews, no need to fetch
    if (initialReviews.length > 0) {
      setReviews(initialReviews);
      setLoading(false);
      return;
    }

    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/campgrounds/${campgroundId}/reviews`);
        const data = response.data;
        setReviews(data.reviews || []);
        setError(null);
      } catch (err) {
        logError('Error fetching reviews', err);
        setError('Failed to load reviews. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [campgroundId, initialReviews]);

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      await apiClient.delete(`/campgrounds/${campgroundId}/reviews/${reviewId}`);

      // Update local state
      setReviews(reviews.filter((review) => review._id !== reviewId));

      // Notify parent component
      if (onReviewDeleted) {
        onReviewDeleted(reviewId);
      }
    } catch (err) {
      logError('Error deleting review', err);
      alert('Failed to delete review. Please try again later.');
    }
  };

  if (loading) {
    return <div className="review-list-loading">Loading reviews...</div>;
  }

  if (error) {
    return <div className="review-list-error">{error}</div>;
  }

  if (!reviews || reviews.length === 0) {
    return <div className="review-list-empty">No reviews yet. Be the first to leave a review!</div>;
  }

  return (
    <div className="review-list">
      <h3 className="review-list-title">Reviews ({reviews.length})</h3>

      {reviews.map((review) => {
        // Handle cases where author might be null or missing
        const author = review.author || {};
        const canDelete = currentUser && (currentUser._id === author._id || currentUser.isAdmin);

        // Log review data for debugging
        logInfo('Rendering review', {
          reviewId: review._id,
          authorId: author._id,
          authorUsername: author.username,
          rating: review.rating,
          hasBody: !!review.body,
        });

        return (
          <div key={review._id} id={`review-${review._id}`} className="review-item">
            <div className="review-header">
              <span className="review-author">{author.username || 'Unknown User'}</span>
              <StarRating rating={review.rating} />
            </div>

            <p className="review-body">{review.body}</p>

            {canDelete && (
              <button
                onClick={() => handleDeleteReview(review._id)}
                className="review-delete-button"
                aria-label="Delete review"
              >
                Delete
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

ReviewList.propTypes = {
  campgroundId: PropTypes.string.isRequired,
  initialReviews: PropTypes.array,
  onReviewDeleted: PropTypes.func,
};

export default ReviewList;
