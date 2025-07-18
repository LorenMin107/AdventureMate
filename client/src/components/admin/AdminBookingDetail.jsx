import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/api';
import { logError } from '../../utils/logger';
import ConfirmDialog from '../common/ConfirmDialog';
import './AdminBookingDetail.css';

/**
 * AdminBookingDetail component displays detailed information about a booking for admin users
 *
 * @param {Object} props - Component props
 * @param {Object} props.initialBooking - Initial booking data (optional)
 * @returns {JSX.Element} Admin booking detail component
 */
const AdminBookingDetail = ({ initialBooking = null }) => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

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

    // Only fetch if user is admin and we have an ID
    if (!currentUser?.isAdmin || !id) {
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/bookings/${id}`);
        // Handle the ApiResponse format
        const responseData = response.data;
        const data = responseData.data || responseData; // Handle both ApiResponse format and direct data
        setBooking(data.booking);
        setError(null);
      } catch (err) {
        logError('Error fetching booking', err);
        setError(t('adminBookingDetail.errorMessage'));
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id, initialBooking, currentUser, t]);

  if (!currentUser?.isAdmin) {
    return (
      <div className="admin-booking-detail-unauthorized">
        {t('adminBookingDetail.unauthorizedMessage')}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-booking-detail-loading">{t('adminBookingDetail.loadingMessage')}</div>
    );
  }

  if (error) {
    return <div className="admin-booking-detail-error">{error}</div>;
  }

  if (!booking) {
    return (
      <div className="admin-booking-detail-not-found">
        {t('adminBookingDetail.notFoundMessage')}
      </div>
    );
  }

  // Format date to local string
  const formatDate = (dateString) => {
    if (!dateString) return t('adminBookingDetail.notAvailable');
    return new Date(dateString).toLocaleDateString();
  };

  const handleCancelClick = () => {
    setCancelDialog({
      open: true,
      booking,
    });
  };

  const handleCancelConfirm = async () => {
    try {
      await apiClient.delete(`/admin/bookings/${booking._id}`);

      // Navigate back to bookings list
      navigate('/admin/bookings');

      // Close the dialog
      setCancelDialog({ open: false, booking: null });
    } catch (err) {
      logError('Error canceling booking', err);
      alert(t('adminBookingDetail.cancelBookingError'));
    }
  };

  const handleCancelCancel = () => {
    setCancelDialog({ open: false, booking: null });
  };

  const {
    campground,
    campsite,
    user,
    startDate,
    endDate,
    totalDays,
    totalPrice,
    sessionId,
    createdAt,
    status,
    paid,
  } = booking;

  return (
    <div className="admin-booking-detail">
      <h2 className="admin-booking-detail-title">{t('adminBookingDetail.title')}</h2>

      <div className="admin-booking-detail-card">
        {/* Left Column - Trip Summary */}
        <div className="admin-booking-detail-header">
          <div className="admin-booking-detail-image">
            {campground.images && campground.images.length > 0 ? (
              <img src={campground.images[0].url} alt={campground.title} />
            ) : (
              <div className="admin-booking-detail-no-image">
                {t('adminBookingDetail.noImageAvailable')}
              </div>
            )}
          </div>

          <div className="admin-booking-detail-campground-info">
            <h3>{campground.title}</h3>
            <p className="admin-booking-detail-location">{campground.location}</p>

            {campsite && (
              <div className="admin-booking-detail-campsite-info">
                <h4>Campsite: {campsite.name}</h4>
                {campsite.price && (
                  <p className="admin-booking-detail-campsite-price">
                    ${campsite.price} {t('adminBookingDetail.perNight')}
                  </p>
                )}
                {campsite.capacity && (
                  <p className="admin-booking-detail-campsite-capacity">
                    {t('adminBookingDetail.capacity', {
                      capacity: campsite.capacity,
                      person:
                        campsite.capacity === 1
                          ? t('adminBookingDetail.person')
                          : t('adminBookingDetail.people'),
                    })}
                  </p>
                )}
                {campsite.features && campsite.features.length > 0 && (
                  <div className="admin-booking-detail-campsite-features">
                    <p>{t('adminBookingDetail.features')}</p>
                    <div className="admin-booking-detail-feature-tags">
                      {campsite.features.map((feature, index) => (
                        <span key={index} className="admin-booking-detail-feature-tag">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="admin-booking-detail-trip-dates">
            <h4>{t('adminBookingDetail.tripInformation')}</h4>
            <div className="admin-booking-detail-dates-container">
              <div className="admin-booking-detail-date-box">
                <div className="admin-booking-detail-date-label">
                  {t('adminBookingDetail.checkIn')}
                </div>
                <div className="admin-booking-detail-date-value">{formatDate(startDate)}</div>
              </div>

              <div className="admin-booking-detail-dates-divider">→</div>

              <div className="admin-booking-detail-date-box">
                <div className="admin-booking-detail-date-label">
                  {t('adminBookingDetail.checkOut')}
                </div>
                <div className="admin-booking-detail-date-value">{formatDate(endDate)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Booking Details */}
        <div className="admin-booking-detail-info">
          {/* User Information Section */}
          <div className="admin-booking-detail-section">
            <div className="admin-booking-detail-section-header">
              <h4 className="admin-booking-detail-section-title">
                {t('adminBookingDetail.userInformation')}
              </h4>
            </div>
            <div className="admin-booking-detail-section-content">
              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">
                  {t('adminBookingDetail.username')}
                </span>
                <span className="admin-booking-detail-value">{user.username}</span>
              </div>

              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">{t('adminBookingDetail.email')}</span>
                <span className="admin-booking-detail-value">{user.email}</span>
              </div>

              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">{t('adminBookingDetail.userId')}</span>
                <span className="admin-booking-detail-value">{user._id}</span>
              </div>
            </div>
          </div>

          {/* Reservation Details Section */}
          <div className="admin-booking-detail-section">
            <div className="admin-booking-detail-section-header">
              <h4 className="admin-booking-detail-section-title">
                {t('adminBookingDetail.reservationDetails')}
              </h4>
            </div>
            <div className="admin-booking-detail-section-content">
              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">
                  {t('adminBookingDetail.bookingId')}
                </span>
                <span className="admin-booking-detail-value">{booking._id}</span>
              </div>

              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">
                  {t('adminBookingDetail.bookingDate')}
                </span>
                <span className="admin-booking-detail-value">{formatDate(createdAt)}</span>
              </div>

              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">
                  {t('adminBookingDetail.totalNights')}
                </span>
                <span className="admin-booking-detail-value">{totalDays}</span>
              </div>

              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">{t('adminBookingDetail.status')}</span>
                <span
                  className={`admin-booking-detail-value admin-booking-detail-status admin-booking-detail-status-${status}`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>

              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">
                  {t('adminBookingDetail.paymentStatus')}
                </span>
                <span
                  className={`admin-booking-detail-value admin-booking-detail-payment-status ${paid ? 'paid' : 'unpaid'}`}
                >
                  {paid ? t('adminBookingDetail.paid') : t('adminBookingDetail.unpaid')}
                </span>
              </div>

              {sessionId && (
                <div className="admin-booking-detail-info-item transaction-id-item">
                  <span className="admin-booking-detail-label">
                    {t('adminBookingDetail.transactionId')}
                  </span>
                  <span
                    className="admin-booking-detail-value transaction-id-value"
                    title={sessionId}
                  >
                    {sessionId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Price Details Section */}
          <div className="admin-booking-detail-section">
            <div className="admin-booking-detail-section-header">
              <h4 className="admin-booking-detail-section-title">
                {t('adminBookingDetail.priceDetails')}
              </h4>
            </div>
            <div className="admin-booking-detail-section-content">
              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">
                  ${(totalPrice / totalDays).toFixed(2)} × {totalDays} nights
                </span>
                <span className="admin-booking-detail-value">${totalPrice.toFixed(2)}</span>
              </div>

              <div className="admin-booking-detail-price-breakdown">
                <div className="admin-booking-detail-info-item">
                  <span className="admin-booking-detail-label">
                    {t('adminBookingDetail.totalUsd')}
                  </span>
                  <span className="admin-booking-detail-value admin-booking-detail-price">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="admin-booking-detail-footer">
            <Link to="/admin/bookings" className="admin-booking-detail-back-button">
              {t('adminBookingDetail.backToBookings')}
            </Link>

            <Link to={`/admin/users/${user._id}`} className="admin-booking-detail-user-button">
              {t('adminBookingDetail.viewUser')}
            </Link>

            <Link to={`/admin/campgrounds`} className="admin-booking-detail-campground-button">
              {t('adminBookingDetail.viewCampgrounds')}
            </Link>

            <Link to={`/admin/campsites`} className="admin-booking-detail-campsite-button">
              {t('adminBookingDetail.manageCampsites')}
            </Link>

            {campsite && campsite._id ? (
              <Link
                to={`/campsites/${campsite._id}`}
                className="admin-booking-detail-campsite-button"
              >
                {t('adminBookingDetail.viewCampsite')}
              </Link>
            ) : campsite ? (
              <Link to={`/campsites/${campsite}`} className="admin-booking-detail-campsite-button">
                {t('adminBookingDetail.viewCampsite')}
              </Link>
            ) : null}

            <button onClick={handleCancelClick} className="admin-booking-detail-cancel-button">
              {t('adminBookingDetail.cancelBooking')}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={cancelDialog.open}
        onClose={handleCancelCancel}
        onConfirm={handleCancelConfirm}
        title={t('adminBookingDetail.cancelBookingTitle')}
        message={t('adminBookingDetail.cancelBookingMessage')}
        confirmLabel={t('adminBookingDetail.cancelBookingConfirm')}
        cancelLabel={t('adminBookingDetail.keepBooking')}
      />
    </div>
  );
};

AdminBookingDetail.propTypes = {
  initialBooking: PropTypes.object,
};

export default AdminBookingDetail;
