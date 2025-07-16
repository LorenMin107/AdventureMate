import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';
import apiClient from '../utils/api';
import { logError } from '../utils/logger';
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
  const { t } = useTranslation();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser, isAuthenticated } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError(t('reviews.loginRequired'));
      return;
    }

    if (rating < 1 || rating > 5) {
      setError(t('reviews.ratingRequired'));
      return;
    }

    if (!body.trim()) {
      setError(t('reviews.commentRequired'));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await apiClient.post(`/campgrounds/${campgroundId}/reviews`, {
        rating,
        body,
      });
      const data = response.data;

      // Reset form
      setRating(5);
      setBody('');

      // Notify parent component
      if (onReviewSubmitted) {
        onReviewSubmitted(data.review);
      }
    } catch (err) {
      logError('Error submitting review', err);
      setError(err.message || t('reviews.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="review-form-login-message">
        {t('reviews.pleaseLogin')} <a href="/login">{t('auth.login')}</a>{' '}
        {t('reviews.toLeaveReview')}.
      </div>
    );
  }

  return (
    <div className="review-form">
      <h3 className="review-form-title">{t('reviews.leaveReview')}</h3>

      {error && <div className="review-form-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="review-form-rating">
          <label>{t('reviews.rating')}:</label>
          <StarRating rating={rating} editable={true} onChange={setRating} />
        </div>

        <div className="review-form-body">
          <label htmlFor="review-body">{t('reviews.review')}:</label>
          <textarea
            id="review-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('reviews.shareExperience')}
            rows={4}
            required
          />
        </div>

        <button type="submit" className="review-form-submit" disabled={submitting}>
          {submitting ? t('reviews.submitting') : t('reviews.submitReview')}
        </button>
      </form>
    </div>
  );
};

ReviewForm.propTypes = {
  campgroundId: PropTypes.string.isRequired,
  onReviewSubmitted: PropTypes.func,
};

export default ReviewForm;
