import { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';
import './ReviewForm.css';

/**
 * ReviewForm component for submitting new reviews
 * 
 * @param {Object} props - Component props
 * @param {string} props.campgroundId - ID of the campground being reviewed
 * @param {function} props.onReviewSubmitted - Callback function when a review is successfully submitted
 * @returns {JSX.Element} Review form component
 */
const ReviewForm = ({ campgroundId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser, isAuthenticated } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('You must be logged in to submit a review');
      return;
    }
    
    if (rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5 stars');
      return;
    }
    
    if (!body.trim()) {
      setError('Please enter a review comment');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await fetch(`/api/campgrounds/${campgroundId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ rating, body }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }
      
      const data = await response.json();
      
      // Reset form
      setRating(5);
      setBody('');
      
      // Notify parent component
      if (onReviewSubmitted) {
        onReviewSubmitted(data.review);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Failed to submit review. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="review-form-login-message">
        Please <a href="/login">log in</a> to leave a review.
      </div>
    );
  }

  return (
    <div className="review-form">
      <h3 className="review-form-title">Leave a Review</h3>
      
      {error && (
        <div className="review-form-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="review-form-rating">
          <label>Rating:</label>
          <StarRating 
            rating={rating} 
            editable={true} 
            onChange={setRating} 
          />
        </div>
        
        <div className="review-form-body">
          <label htmlFor="review-body">Review:</label>
          <textarea
            id="review-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your experience at this campground..."
            rows={4}
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="review-form-submit"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

ReviewForm.propTypes = {
  campgroundId: PropTypes.string.isRequired,
  onReviewSubmitted: PropTypes.func
};

export default ReviewForm;