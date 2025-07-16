import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          err.response?.data?.message || err.message || t('bookings.errorLoadingBookings');
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

      addSuccessMessage(t('bookings.cancelSuccess'));

      // Close the dialog
      setCancelDialog({ open: false, booking: null });
    } catch (error) {
      logError('Error cancelling booking', error);
      addErrorMessage(error.response?.data?.message || t('bookings.cancelError'));
    }
  };

  const handleCancelCancel = () => {
    setCancelDialog({ open: false, booking: null });
  };

  if (!isAuthenticated) {
    return (
      <div className="booking-list-login-message">
        {t('bookings.loginRequired')} <a href="/login">{t('auth.login')}</a>{' '}
        {t('bookings.toViewBookings')}.
      </div>
    );
  }

  if (loading) {
    return <div className="booking-list-loading">{t('bookings.loadingBookings')}</div>;
  }

  if (error) {
    return <div className="booking-list-error">{error}</div>;
  }

  if (bookings.length === 0) {
    return (
      <div className="booking-list-empty">
        <p>{t('bookings.noBookingsYet')}</p>
        <Link to="/campgrounds" className="booking-list-browse-link">
          {t('bookings.browseCampgrounds')}
        </Link>
      </div>
    );
  }

  // Format date to local string
  const formatDate = (dateString) => {
    if (!dateString) return t('bookings.notAvailable');
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
      <h2 className="booking-list-title">
        {t('bookings.userBookings', { username: currentUser.username })}
      </h2>

      <div className="booking-list-table-container">
        <table className="booking-list-table">
          <thead>
            <tr>
              <th>{t('bookings.campground')}</th>
              <th>{t('bookings.campsite')}</th>
              <th>{t('bookings.checkIn')}</th>
              <th>{t('bookings.checkOut')}</th>
              <th>{t('bookings.days')}</th>
              <th>{t('bookings.total')}</th>
              <th>{t('bookings.statusLabel')}</th>
              <th>{t('bookings.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking._id} className="booking-list-item">
                <td className="booking-list-campground">
                  {booking.campground && booking.campground.title
                    ? booking.campground.title
                    : t('bookings.campgroundNameNotAvailable')}
                </td>
                <td className="booking-list-campsite">
                  {booking.campsite && booking.campsite.name
                    ? booking.campsite.name
                    : t('bookings.noSpecificCampsite')}
                </td>
                <td>{formatDate(booking.startDate)}</td>
                <td>{formatDate(booking.endDate)}</td>
                <td>{booking.totalDays}</td>
                <td className="booking-list-price">${booking.totalPrice.toFixed(2)}</td>
                <td>
                  <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                    {booking.status
                      ? t(`bookings.status.${booking.status}`)
                      : t('bookings.status.pending')}
                  </span>
                </td>
                <td className="booking-list-actions">
                  <Link to={`/bookings/${booking._id}`} className="booking-list-view-button">
                    {t('bookings.view')}
                  </Link>
                  {canCancelBooking(booking) && (
                    <button
                      onClick={() => handleCancelClick(booking)}
                      className="booking-list-cancel-button"
                      disabled={cancelBookingMutation.isLoading}
                      title={t('bookings.cancelBookingNoRefund')}
                    >
                      {cancelBookingMutation.isLoading ? '...' : t('bookings.cancel')}
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
        title={t('bookings.cancelBookingTitle')}
        message={
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>{t('bookings.cancelBookingConfirm')}</strong>
            </div>
            <div style={{ marginBottom: '1rem' }}>{t('bookings.cancelBookingCannotUndo')}</div>
            <div className="cancel-warning">
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>{t('bookings.cancelWarningTitle')}</strong>
              </div>
              <div>{t('bookings.cancelWarningMessage')}</div>
            </div>
          </div>
        }
        confirmLabel={t('bookings.cancelBookingNoRefund')}
        cancelLabel={t('bookings.keepBooking')}
        confirmButtonClass="danger"
      />
    </div>
  );
};

BookingList.propTypes = {
  initialBookings: PropTypes.array,
};

export default BookingList;
