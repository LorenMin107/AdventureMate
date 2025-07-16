import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/api';
import StarRating from './StarRating';
import './ReviewList.css';
import { logError } from '../utils/logger';

/**
 * UserReviewList component displays a list of reviews created by the user
 *
 * @param {Object} props - Component props
 * @param {Array} props.initialReviews - Initial reviews data (optional)
 * @returns {JSX.Element} User review list component
 */
const UserReviewList = ({ initialReviews = [] }) => {
  const { t } = useTranslation();
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
        const response = await apiClient.get('/users/reviews');

        // With apiClient, the response is already parsed and in response.data
        const data = response.data;
        setReviews(data.reviews || []);
        setError(null);
      } catch (err) {
        logError('Error fetching user reviews', err);
        // Improved error handling for axios errors
        const errorMessage =
          err.response?.data?.message || err.message || t('reviews.errorLoadingUserReviews');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUserReviews();
  }, [initialReviews, isAuthenticated]);

  const handleDeleteReview = async (reviewId, campgroundId) => {
    if (!window.confirm(t('reviews.deleteConfirm'))) {
      return;
    }

    // If campgroundId is not provided, we can't delete the review
    if (!campgroundId) {
      logError('Cannot delete review: campground ID is missing');
      alert(t('reviews.cannotDeleteMissingCampground'));
      return;
    }

    try {
      // Use apiClient.delete which automatically includes the JWT token
      await apiClient.delete(`/campgrounds/${campgroundId}/reviews/${reviewId}`);

      // Update local state
      setReviews(reviews.filter((review) => review._id !== reviewId));
    } catch (err) {
      logError('Error deleting review', err);
      // Improved error handling for axios errors
      const errorMessage = err.response?.data?.message || err.message || t('reviews.deleteError');
      alert(errorMessage);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="review-list-login-message">
        {t('reviews.pleaseLogin')} <a href="/login">{t('auth.login')}</a>{' '}
        {t('reviews.toViewYourReviews')}.
      </div>
    );
  }

  if (loading) {
    return <div className="review-list-loading">{t('reviews.loadingUserReviews')}</div>;
  }

  if (error) {
    return <div className="review-list-error">{error}</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="review-list-empty">
        <p>{t('reviews.noReviewsYet')}</p>
        <Link to="/campgrounds" className="review-list-browse-link">
          {t('reviews.browseCampgrounds')}
        </Link>
      </div>
    );
  }

  return (
    <div className="review-list">
      <h2 className="review-list-title">
        {t('reviews.userReviews', { username: currentUser.username })}
      </h2>

      {reviews.map((review) => (
        <div key={review._id} className="review-item">
          <div className="review-header">
            {review.campground && review.campground._id ? (
              <Link
                to={`/campgrounds/${review.campground._id}#review-${review._id}`}
                className="review-campground"
              >
                {review.campground.title || t('reviews.unknownCampground')}
              </Link>
            ) : (
              <span className="review-campground">{t('reviews.unknownCampground')}</span>
            )}
            <StarRating rating={review.rating} />
          </div>

          <p className="review-body">{review.body}</p>
          <p className="review-date">
            {new Date(parseInt(review._id.substring(0, 8), 16) * 1000).toLocaleDateString()}
          </p>

          <button
            onClick={() =>
              handleDeleteReview(review._id, review.campground ? review.campground._id : null)
            }
            className="review-delete-button"
            aria-label={t('reviews.deleteReview')}
          >
            {t('reviews.delete')}
          </button>
        </div>
      ))}
    </div>
  );
};

UserReviewList.propTypes = {
  initialReviews: PropTypes.array,
};

export default UserReviewList;
