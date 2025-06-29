import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';
import './ReviewList.css';

/**
 * UserReviewList component displays a list of reviews created by the user
 * 
 * @param {Object} props - Component props
 * @param {Array} props.initialReviews - Initial reviews data (optional)
 * @returns {JSX.Element} User review list component
 */
const UserReviewList = ({ initialReviews = [] }) => {
  const [reviews, setReviews] = useState(initialReviews);
  const [loading, setLoading] = useState(!initialReviews.length);
  const [error, setError] = useState(null);
  const { currentUser, isAuthenticated } = useAuth();

  useEffect(() => {
    // If we have initial reviews, no need to fetch
    if (initialReviews.length > 0) {
      setReviews(initialReviews);
      setLoading(false);
      return;
    }

    // Only fetch if user is authenticated
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchUserReviews = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users/reviews', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.status}`);
        }

        const data = await response.json();
        setReviews(data.reviews || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching user reviews:', err);
        setError('Failed to load reviews. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserReviews();
  }, [initialReviews, isAuthenticated]);

  const handleDeleteReview = async (reviewId, campgroundId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    // If campgroundId is not provided, we can't delete the review
    if (!campgroundId) {
      console.error('Cannot delete review: campground ID is missing');
      alert('Cannot delete this review because the campground information is missing.');
      return;
    }

    try {
      const response = await fetch(`/api/campgrounds/${campgroundId}/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete review: ${response.status}`);
      }

      // Update local state
      setReviews(reviews.filter(review => review._id !== reviewId));
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Failed to delete review. Please try again later.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="review-list-login-message">
        Please <a href="/login">log in</a> to view your reviews.
      </div>
    );
  }

  if (loading) {
    return <div className="review-list-loading">Loading reviews...</div>;
  }

  if (error) {
    return <div className="review-list-error">{error}</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="review-list-empty">
        <p>You haven't written any reviews yet.</p>
        <Link to="/campgrounds" className="review-list-browse-link">
          Browse Campgrounds
        </Link>
      </div>
    );
  }

  return (
    <div className="review-list">
      <h2 className="review-list-title">{currentUser.username}'s Reviews</h2>

      {reviews.map(review => (
        <div key={review._id} className="review-item">
          <div className="review-header">
            {review.campground ? (
              <Link to={`/campgrounds/${review.campground._id}`} className="review-campground">
                {review.campground.title || 'Unknown Campground'}
              </Link>
            ) : (
              <span className="review-campground">Unknown Campground</span>
            )}
            <StarRating rating={review.rating} />
          </div>

          <p className="review-body">{review.body}</p>
          <p className="review-date">
            {review._id ? `ID: ${review._id.toString().substring(0, 10)}...` : 'No ID available'}
          </p>

          <button 
            onClick={() => handleDeleteReview(review._id, review.campground ? review.campground._id : null)}
            className="review-delete-button"
            aria-label="Delete review"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

UserReviewList.propTypes = {
  initialReviews: PropTypes.array
};

export default UserReviewList;
