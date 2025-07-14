import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import { useCancelBooking } from '../hooks/useBookings';
import apiClient from '../utils/api';
import { logError } from '../utils/logger';
import ConfirmDialog from './common/ConfirmDialog';
import './BookingDetail.css';

/**
 * BookingDetail component displays detailed information about a booking
 *
 * @param {Object} props - Component props
 * @param {Object} props.initialBooking - Initial booking data (optional)
 * @returns {JSX.Element} Booking detail component
 */
const BookingDetail = ({ initialBooking = null }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const { addSuccessMessage, addErrorMessage } = useFlashMessage();
  const cancelBookingMutation = useCancelBooking();

  const [booking, setBooking] = useState(initialBooking);
  const [loading, setLoading] = useState(!initialBooking);
  const [error, setError] = useState(null);
  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    booking: null,
  });

  useEffect(() => {
    // If we have initial booking data, no need to fetch
    if (initialBooking) {
      setBooking(initialBooking);
      setLoading(false);
      return;
    }

    // Only fetch if user is authenticated and we have an ID
    if (!isAuthenticated || !id) {
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        setLoading(true);

        // Try owner endpoint first if user is an owner
        let response;

        if (currentUser?.isOwner) {
          try {
            // First try the owner endpoint (for bookings on their campgrounds)
            response = await apiClient.get(`/owners/bookings/${id}`);
          } catch (ownerErr) {
            if (ownerErr.response?.status === 403) {
              // If 403, it means the owner doesn't own this campground
              // So this is likely their own booking as a customer
              response = await apiClient.get(`/bookings/${id}`);
            } else {
              throw ownerErr;
            }
          }
        } else {
          response = await apiClient.get(`/bookings/${id}`);
        }

        const data = response.data;
        setBooking(data.booking);
        setError(null);
      } catch (err) {
        logError('Error fetching booking', err);
        setError('Failed to load booking details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id, initialBooking, isAuthenticated]);

  const handleCancelClick = () => {
    setCancelDialog({
      open: true,
      booking,
    });
  };

  const handleCancelConfirm = async () => {
    try {
      await cancelBookingMutation.mutateAsync(booking._id);

      // Update the booking status locally
      setBooking((prev) => ({ ...prev, status: 'cancelled' }));

      addSuccessMessage(
        'Booking cancelled successfully. Please note that no refunds will be issued for cancelled bookings.'
      );

      // Close the dialog
      setCancelDialog({ open: false, booking: null });
    } catch (error) {
      logError('Error cancelling booking', error);
      addErrorMessage(
        error.response?.data?.message || 'Failed to cancel booking. Please try again.'
      );
    }
  };

  const handleCancelCancel = () => {
    setCancelDialog({ open: false, booking: null });
  };

  if (!isAuthenticated) {
    return (
      <div className="booking-detail-login-message">
        Please <a href="/login">log in</a> to view booking details.
      </div>
    );
  }

  if (loading) {
    return <div className="booking-detail-loading">Loading booking details...</div>;
  }

  if (error) {
    return <div className="booking-detail-error">{error}</div>;
  }

  if (!booking) {
    return <div className="booking-detail-not-found">Booking not found</div>;
  }

  // Check if user is authorized to view this booking
  const isAuthorized =
    currentUser &&
    (currentUser._id === booking.user._id || currentUser.isAdmin || currentUser.isOwner);

  if (!isAuthorized) {
    return (
      <div className="booking-detail-unauthorized">
        You are not authorized to view this booking.
      </div>
    );
  }

  // Format date to local string
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString();
  };

  const { campground, campsite, startDate, endDate, totalDays, totalPrice, sessionId, status } =
    booking;

  // Check if booking can be cancelled (not already cancelled and not in the past)
  // Only the booking owner can cancel, not campground owners
  const canCancel =
    status !== 'cancelled' &&
    new Date(startDate) > new Date() &&
    currentUser._id === booking.user._id;

  return (
    <div className="booking-detail">
      <div className="booking-detail-card">
        {/* Left Column - Trip Summary */}
        <div className="booking-detail-header">
          <div className="booking-detail-image">
            {campground.images && campground.images.length > 0 ? (
              <img src={campground.images[0].url} alt={campground.title} />
            ) : (
              <div className="booking-detail-no-image">No image available</div>
            )}
          </div>

          <div className="booking-detail-campground-info">
            <h3>{campground.title}</h3>
            <p className="booking-detail-location">{campground.location}</p>
            {status && (
              <div className={`booking-detail-status booking-detail-status-${status}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
            )}
          </div>

          {campsite && (
            <div className="booking-detail-campsite-info">
              <h4>Campsite: {campsite.name}</h4>
              {campsite.price && (
                <p className="booking-detail-campsite-price">${campsite.price} per night</p>
              )}
              {campsite.capacity && (
                <p className="booking-detail-campsite-capacity">
                  Capacity: {campsite.capacity} {campsite.capacity === 1 ? 'person' : 'people'}
                </p>
              )}
              {campsite.features && campsite.features.length > 0 && (
                <div className="booking-detail-campsite-features">
                  <p>Features:</p>
                  <div className="booking-detail-feature-tags">
                    {campsite.features.map((feature, index) => (
                      <span key={index} className="booking-detail-feature-tag">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="booking-detail-trip-dates">
            <h4>Your trip</h4>
            <div className="booking-detail-dates-container">
              <div className="booking-detail-date-box">
                <div className="booking-detail-date-label">Check-in</div>
                <div className="booking-detail-date-value">{formatDate(startDate)}</div>
              </div>

              <div className="booking-detail-dates-divider">→</div>

              <div className="booking-detail-date-box">
                <div className="booking-detail-date-label">Checkout</div>
                <div className="booking-detail-date-value">{formatDate(endDate)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Booking Details */}
        <div className="booking-detail-info">
          {/* Reservation Details Section */}
          <div className="booking-detail-section">
            <div className="booking-detail-section-header">
              <h4 className="booking-detail-section-title">Reservation details</h4>
            </div>
            <div className="booking-detail-section-content">
              <div className="booking-detail-info-item">
                <span className="booking-detail-label">Booking ID</span>
                <span className="booking-detail-value">{booking._id}</span>
              </div>

              <div className="booking-detail-info-item">
                <span className="booking-detail-label">Total nights</span>
                <span className="booking-detail-value">{totalDays}</span>
              </div>

              {sessionId && (
                <div className="booking-detail-info-item transaction-id-item">
                  <span className="booking-detail-label">Transaction ID</span>
                  <span className="booking-detail-value transaction-id-value" title={sessionId}>
                    {sessionId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Price Details Section */}
          <div className="booking-detail-section">
            <div className="booking-detail-section-header">
              <h4 className="booking-detail-section-title">Price details</h4>
            </div>
            <div className="booking-detail-section-content">
              <div className="booking-detail-info-item">
                <span className="booking-detail-label">
                  ${(totalPrice / totalDays).toFixed(2)} × {totalDays} nights
                </span>
                <span className="booking-detail-value">${totalPrice.toFixed(2)}</span>
              </div>

              <div className="booking-detail-price-breakdown">
                <div className="booking-detail-info-item">
                  <span className="booking-detail-label">Total (USD)</span>
                  <span className="booking-detail-value booking-detail-price">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="booking-detail-footer">
            <Link to="/bookings" className="booking-detail-back-button">
              Back to Bookings
            </Link>

            <Link
              to={`/campgrounds/${campground._id}`}
              className="booking-detail-campground-button"
            >
              View Campground
            </Link>

            {campsite && (campsite._id || typeof campsite === 'string') && (
              <Link
                to={`/campsites/${campsite._id || campsite}`}
                className="booking-detail-campsite-button"
              >
                View Campsite
              </Link>
            )}

            {canCancel && (
              <button
                onClick={handleCancelClick}
                className="booking-detail-cancel-button"
                disabled={cancelBookingMutation.isLoading}
              >
                {cancelBookingMutation.isLoading ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={cancelDialog.open}
        onClose={handleCancelCancel}
        onConfirm={handleCancelConfirm}
        title="Cancel Booking"
        message={
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Are you sure you want to cancel this booking?</strong>
            </div>
            <div style={{ marginBottom: '1rem' }}>This action cannot be undone.</div>
            <div className="cancel-warning">
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>⚠️ Important: No Refunds</strong>
              </div>
              <div>
                Please note that cancelled bookings are not eligible for refunds. The full amount
                paid will not be returned.
              </div>
            </div>
          </div>
        }
        confirmLabel="Cancel Booking (No Refund)"
        cancelLabel="Keep Booking"
        confirmButtonClass="danger"
      />
    </div>
  );
};

BookingDetail.propTypes = {
  initialBooking: PropTypes.object,
};

export default BookingDetail;
