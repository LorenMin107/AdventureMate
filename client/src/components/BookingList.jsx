import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import { useCancelBooking } from '../hooks/useBookings';
import apiClient from '../utils/api';
import { logError } from '../utils/logger';
import ConfirmDialog from './common/ConfirmDialog';
import './BookingList.css';

/**
 * BookingList component displays a list of bookings for the current user
 *
 * @param {Object} props - Component props
 * @param {Array} props.initialBookings - Initial bookings data (optional)
 * @returns {JSX.Element} Booking list component
 */
const BookingList = ({ initialBookings = [] }) => {
  const [bookings, setBookings] = useState(initialBookings);
  const [loading, setLoading] = useState(!initialBookings.length);
  const [error, setError] = useState(null);
  const { currentUser, isAuthenticated } = useAuth();
  const { addSuccessMessage, addErrorMessage } = useFlashMessage();
  const cancelBookingMutation = useCancelBooking();

  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    booking: null,
  });

  useEffect(() => {
    // If we have initial bookings, no need to fetch
    if (initialBookings.length > 0) {
      setBookings(initialBookings);
      setLoading(false);
      return;
    }

    // Only fetch if user is authenticated
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/bookings');

        // With apiClient, the response is already parsed and in response.data
        const data = response.data;
        setBookings(data.bookings || []);
        setError(null);
      } catch (err) {
        logError('Error fetching bookings', err);
        // Improved error handling for axios errors
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          'Failed to load bookings. Please try again later.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [initialBookings, isAuthenticated]);

  const handleCancelClick = (booking) => {
    setCancelDialog({
      open: true,
      booking,
    });
  };

  const handleCancelConfirm = async () => {
    const { booking } = cancelDialog;

    try {
      await cancelBookingMutation.mutateAsync(booking._id);

      // Update the booking status locally
      setBookings((prev) =>
        prev.map((b) => (b._id === booking._id ? { ...b, status: 'cancelled' } : b))
      );

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
      <div className="booking-list-login-message">
        Please <a href="/login">log in</a> to view your bookings.
      </div>
    );
  }

  if (loading) {
    return <div className="booking-list-loading">Loading bookings...</div>;
  }

  if (error) {
    return <div className="booking-list-error">{error}</div>;
  }

  if (bookings.length === 0) {
    return (
      <div className="booking-list-empty">
        <p>You don't have any bookings yet.</p>
        <Link to="/campgrounds" className="booking-list-browse-link">
          Browse Campgrounds
        </Link>
      </div>
    );
  }

  // Format date to local string
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString();
  };

  // Check if booking can be cancelled
  const canCancelBooking = (booking) => {
    return booking.status !== 'cancelled' && new Date(booking.startDate) > new Date();
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  };

  return (
    <div className="booking-list">
      <h2 className="booking-list-title">{currentUser.username}'s Bookings</h2>

      <div className="booking-list-table-container">
        <table className="booking-list-table">
          <thead>
            <tr>
              <th>Campground</th>
              <th>Campsite</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Days</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking._id} className="booking-list-item">
                <td className="booking-list-campground">
                  {booking.campground && booking.campground.title
                    ? booking.campground.title
                    : 'Campground name not available'}
                </td>
                <td className="booking-list-campsite">
                  {booking.campsite && booking.campsite.name
                    ? booking.campsite.name
                    : 'No specific campsite'}
                </td>
                <td>{formatDate(booking.startDate)}</td>
                <td>{formatDate(booking.endDate)}</td>
                <td>{booking.totalDays}</td>
                <td className="booking-list-price">${booking.totalPrice.toFixed(2)}</td>
                <td>
                  <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                    {booking.status
                      ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
                      : 'Pending'}
                  </span>
                </td>
                <td className="booking-list-actions">
                  <Link to={`/bookings/${booking._id}`} className="booking-list-view-button">
                    View
                  </Link>
                  {canCancelBooking(booking) && (
                    <button
                      onClick={() => handleCancelClick(booking)}
                      className="booking-list-cancel-button"
                      disabled={cancelBookingMutation.isLoading}
                      title="Cancel booking (no refunds)"
                    >
                      {cancelBookingMutation.isLoading ? '...' : 'Cancel'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

BookingList.propTypes = {
  initialBookings: PropTypes.array,
};

export default BookingList;
