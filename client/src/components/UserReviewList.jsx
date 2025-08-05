import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/api';
import StarRating from './StarRating';
import ConfirmDialog from './common/ConfirmDialog';
import './ReviewList.css';
import { logError, logInfo } from '../utils/logger';

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
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    reviewId: null,
    campgroundId: null,
  });
  const { currentUser, isAuthenticated } = useAuth();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // If we have initial reviews, no need to fetch
    if (initialReviews.length > 0) {
      setReviews(initialReviews);
      setLoading(false);
      return;
    }

    // Only fetch if user is authenticated and we haven't fetched yet
    if (!isAuthenticated || hasFetchedRef.current) {
      setLoading(false);
      return;
    }

    const fetchUserReviews = async () => {
      try {
        hasFetchedRef.current = true;
        setLoading(true);

        // Add cache-busting parameter to prevent browser caching
        const timestamp = Date.now();
        const response = await apiClient.get(`/users/reviews?_t=${timestamp}`);

        // With apiClient, the response is already parsed and in response.data
        const data = response.data;

        // Log the reviews for debugging
        logInfo('Fetched user reviews', {
          userId: currentUser?._id,
          reviewCount: data.reviews?.length || 0,
          reviews: data.reviews?.map((r) => ({
            id: r._id,
            authorId: r.author?._id,
            authorUsername: r.author?.username,
            campgroundId: r.campground?._id,
            campgroundTitle: r.campground?.title,
            reviewBody: r.body?.substring(0, 50) + '...', // First 50 chars for identification
          })),
        });

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

  const handleDeleteReview = (reviewId, campgroundId) => {
    logInfo('handleDeleteReview called', {
      reviewId,
      campgroundId,
      userId: currentUser?._id,
      totalReviews: reviews.length,
    });

    // If campgroundId is not provided, we can't delete the review
    if (!campgroundId) {
      logError('Cannot delete review: campground ID is missing');
      alert(t('reviews.cannotDeleteMissingCampground'));
      return;
    }

    // Find the review to verify ownership
    const review = reviews.find((r) => r._id === reviewId);
    if (!review) {
      logError('Cannot delete review: review not found in list', {
        reviewId,
        availableReviewIds: reviews.map((r) => r._id),
      });
      alert(t('reviews.reviewNotFound'));
      return;
    }

    logInfo('Found review for deletion', {
      reviewId,
      campgroundId,
      reviewAuthorId: review.author?._id,
      reviewCampgroundId: review.campground?._id,
      reviewCampgroundTitle: review.campground?.title,
    });

    // Verify that the review belongs to the current user
    if (!currentUser || !review.author || currentUser._id !== review.author._id) {
      logError('Cannot delete review: user does not own this review', {
        userId: currentUser?._id,
        reviewAuthorId: review.author?._id,
        reviewId,
      });
      alert(t('reviews.cannotDeleteOthersReview'));
      return;
    }

    setDeleteDialog({ open: true, reviewId, campgroundId });
  };

  const handleDeleteConfirm = async () => {
    const { reviewId, campgroundId } = deleteDialog;

    logInfo('Attempting to delete review from user profile', {
      reviewId,
      campgroundId,
      userId: currentUser?._id,
    });

    try {
      // Use apiClient.delete which automatically includes the JWT token
      await apiClient.delete(`/campgrounds/${campgroundId}/reviews/${reviewId}`);

      logInfo('Successfully deleted review from user profile', {
        reviewId,
        campgroundId,
      });

      // Update local state
      setReviews(reviews.filter((review) => review._id !== reviewId));
    } catch (err) {
      logError('Error deleting review from user profile', err, {
        reviewId,
        campgroundId,
        statusCode: err.response?.status,
        errorMessage: err.response?.data?.message,
      });
      // Improved error handling for axios errors
      const errorMessage = err.response?.data?.message || err.message || t('reviews.deleteError');
      alert(errorMessage);
    } finally {
      setDeleteDialog({ open: false, reviewId: null, campgroundId: null });
    }
  };

  // Function to clear all caches
  const clearAllCaches = () => {
    // Clear all localStorage items that might be caching data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('cache') || key.includes('reviews') || key.includes('campground'))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      logInfo('Cleared cache key', { key });
    });

    logInfo('Cleared all caches', { count: keysToRemove.length });
  };

  // Function to refresh reviews (can be called from parent if needed)
  const refreshReviews = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);

      // Clear all caches first
      clearAllCaches();

      // Reset fetch flag and force fresh data
      hasFetchedRef.current = false;
      const timestamp = Date.now();
      const response = await apiClient.get(
        `/users/reviews?_t=${timestamp}&nocache=true&force=true`
      );
      const data = response.data;
      setReviews(data.reviews || []);
      setError(null);

      logInfo('Refreshed user reviews', {
        userId: currentUser?._id,
        reviewCount: data.reviews?.length || 0,
        reviews: data.reviews?.map((r) => ({
          id: r._id,
          body: r.body?.substring(0, 30) + '...',
          campgroundId: r.campground?._id,
        })),
      });
    } catch (err) {
      logError('Error refreshing user reviews', err);
      const errorMessage =
        err.response?.data?.message || err.message || t('reviews.errorLoadingUserReviews');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, reviewId: null, campgroundId: null });
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
      <div className="review-list-header">
        <h2 className="review-list-title">
          {t('reviews.userReviews', { username: currentUser.username })}
        </h2>
        <div className="review-list-actions">
          <button onClick={refreshReviews} className="review-list-refresh-btn" disabled={loading}>
            {loading ? t('common.loading') : t('common.refresh')}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('reviews.deleteConfirmTitle') || 'Delete Review'}
        message={t('reviews.deleteConfirm')}
        confirmLabel={t('reviews.delete')}
        cancelLabel={t('common.cancel')}
      />

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

          {/* Only show delete button if the review actually belongs to the current user */}
          {currentUser && review.author && currentUser._id === review.author._id && (
            <button
              onClick={() =>
                handleDeleteReview(review._id, review.campground ? review.campground._id : null)
              }
              className="review-delete-button"
              aria-label={t('reviews.deleteReview')}
            >
              {t('reviews.delete')}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

UserReviewList.propTypes = {
  initialReviews: PropTypes.array,
};

export default UserReviewList;
