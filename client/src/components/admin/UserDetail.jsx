import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/api';
import { logError } from '../../utils/logger';
import ConfirmDialog from '../common/ConfirmDialog';
import SuspensionDialog from './SuspensionDialog';
import './UserDetail.css';

/**
 * UserDetail component displays detailed information about a user for administrators
 *
 * @returns {JSX.Element} User detail component
 */
const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [adminDialog, setAdminDialog] = useState({
    open: false,
    action: null,
  });
  const [ownerDialog, setOwnerDialog] = useState({
    open: false,
    action: null,
  });
  const [bookingDialog, setBookingDialog] = useState({
    open: false,
    booking: null,
  });
  const [suspensionDialog, setSuspensionDialog] = useState({
    open: false,
    action: null,
  });
  const [suspensionData, setSuspensionData] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/admin/users/${id}`);
        // Handle the ApiResponse format
        const responseData = response.data;
        const data = responseData.data || responseData; // Handle both ApiResponse format and direct data
        setUser(data.user);
        setError(null);
      } catch (err) {
        logError('Error fetching user details', err);
        setError(err.response?.data?.message || t('userDetail.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.isAdmin && id) {
      fetchUserDetails();
    }
  }, [id, currentUser]);

  const handleToggleAdminClick = () => {
    setAdminDialog({
      open: true,
      action: user.isAdmin ? 'remove' : 'grant',
    });
  };

  const handleToggleAdminConfirm = async () => {
    try {
      const response = await apiClient.patch(`/admin/users/${id}/toggle-admin`, {
        isAdmin: !user.isAdmin,
      });

      // Handle the ApiResponse format
      const responseData = response.data;
      const data = responseData.data || responseData; // Handle both ApiResponse format and direct data
      setUser(data.user);

      // Close the dialog
      setAdminDialog({ open: false, action: null });
    } catch (err) {
      logError('Error updating user', err);
      alert(err.response?.data?.message || t('userDetail.updateError'));
    }
  };

  const handleToggleAdminCancel = () => {
    setAdminDialog({ open: false, action: null });
  };

  const handleToggleOwnerClick = () => {
    setOwnerDialog({
      open: true,
      action: user.isOwner ? 'remove' : 'grant',
    });
  };

  const handleToggleOwnerConfirm = async () => {
    try {
      const response = await apiClient.patch(`/admin/users/${id}/toggle-owner`, {
        isOwner: !user.isOwner,
      });

      // Handle the ApiResponse format
      const responseData = response.data;
      const data = responseData.data || responseData; // Handle both ApiResponse format and direct data
      setUser(data.user);

      // Close the dialog
      setOwnerDialog({ open: false, action: null });
    } catch (err) {
      logError('Error updating user', err);
      alert(err.response?.data?.message || t('userDetail.updateError'));
    }
  };

  const handleToggleOwnerCancel = () => {
    setOwnerDialog({ open: false, action: null });
  };

  const handleCancelBookingClick = (booking) => {
    setBookingDialog({
      open: true,
      booking,
    });
  };

  const handleCancelBookingConfirm = async () => {
    const { booking } = bookingDialog;

    try {
      await apiClient.delete(`/admin/bookings/${booking._id}`);

      // Update user state by removing the canceled booking
      setUser({
        ...user,
        bookings: user.bookings.filter((b) => b._id !== booking._id),
      });

      // Close the dialog
      setBookingDialog({ open: false, booking: null });
    } catch (err) {
      logError('Error canceling booking', err);
      alert(err.response?.data?.message || t('userDetail.cancelBookingError'));
    }
  };

  const handleCancelBookingCancel = () => {
    setBookingDialog({ open: false, booking: null });
  };

  const handleSuspensionClick = () => {
    setSuspensionDialog({
      open: true,
      action: user.isSuspended ? 'reactivate' : 'suspend',
    });
  };

  const handleSuspensionConfirm = async (data) => {
    try {
      const action = suspensionDialog.action;
      let response;

      if (action === 'suspend') {
        response = await apiClient.post(`/admin/users/${id}/suspend`, {
          reason: data.reason,
          duration: data.duration,
        });
      } else {
        response = await apiClient.post(`/admin/users/${id}/reactivate`, {
          reason: data.reason || 'No reason provided',
        });
      }

      // Handle the ApiResponse format
      const responseData = response.data;
      const responseUser = responseData.data || responseData; // Handle both ApiResponse format and direct data
      setUser(responseUser.user);

      // Close the dialog
      setSuspensionDialog({ open: false, action: null });
      setSuspensionData(null);
    } catch (err) {
      logError('Error updating user suspension status', err);
      alert(err.response?.data?.message || t('userDetail.updateError'));
    }
  };

  const handleSuspensionCancel = () => {
    setSuspensionDialog({ open: false, action: null });
    setSuspensionData(null);
  };

  if (!currentUser?.isAdmin) {
    return <div className="user-detail-unauthorized">{t('userDetail.unauthorizedMessage')}</div>;
  }

  if (loading) {
    return <div className="user-detail-loading">{t('userDetail.loadingMessage')}</div>;
  }

  if (error) {
    return <div className="user-detail-error">{error}</div>;
  }

  if (!user) {
    return <div className="user-detail-not-found">{t('userDetail.notFoundMessage')}</div>;
  }

  return (
    <div className="user-detail">
      <div className="user-detail-header">
        <h1>{user.username}'s Profile</h1>
        <Link to="/admin/users" className="user-detail-back-button">
          {t('userDetail.backToUsersButton')}
        </Link>
      </div>

      <div className="user-detail-card">
        <div className="user-detail-info">
          <div className="user-detail-info-item">
            <span className="user-detail-label">{t('userDetail.usernameLabel')}:</span>
            <span className="user-detail-value">{user.username}</span>
          </div>

          <div className="user-detail-info-item">
            <span className="user-detail-label">{t('userDetail.emailLabel')}:</span>
            <span className="user-detail-value">{user.email}</span>
          </div>

          <div className="user-detail-info-item">
            <span className="user-detail-label">{t('userDetail.phoneLabel')}:</span>
            <span className="user-detail-value">{user.phone || t('userDetail.notProvided')}</span>
          </div>

          <div className="user-detail-info-item">
            <span className="user-detail-label">{t('userDetail.accountTypeLabel')}:</span>
            <span className="user-detail-value">
              {user.googleId
                ? t('userDetail.googleOAuthAccount')
                : t('userDetail.traditionalAccount')}
            </span>
          </div>

          <div className="user-detail-info-item">
            <span className="user-detail-label">{t('userDetail.roleLabel')}:</span>
            <span
              className={`user-role ${user.isAdmin ? 'admin' : user.isOwner ? 'owner' : 'user'}`}
            >
              {user.isAdmin
                ? t('userDetail.adminRole')
                : user.isOwner
                  ? t('userDetail.ownerRole')
                  : t('userDetail.userRole')}
            </span>
          </div>

          <div className="user-detail-info-item">
            <span className="user-detail-label">{t('userDetail.ownerStatusLabel')}:</span>
            <span className={`user-status ${user.isOwner ? 'active' : 'inactive'}`}>
              {user.isOwner ? t('userDetail.activeOwnerStatus') : t('userDetail.notOwnerStatus')}
            </span>
          </div>

          <div className="user-detail-info-item">
            <span className="user-detail-label">{t('userDetail.suspensionStatusLabel')}:</span>
            <span className={`user-status ${user.isSuspended ? 'suspended' : 'active'}`}>
              {user.isSuspended ? t('userDetail.suspendedStatus') : t('userDetail.activeStatus')}
            </span>
          </div>

          {user.isSuspended && (
            <>
              <div className="user-detail-info-item">
                <span className="user-detail-label">{t('userDetail.suspensionReasonLabel')}:</span>
                <span className="user-detail-value">{user.suspensionReason}</span>
              </div>
              <div className="user-detail-info-item">
                <span className="user-detail-label">{t('userDetail.suspendedAtLabel')}:</span>
                <span className="user-detail-value">
                  {user.suspendedAt
                    ? new Date(user.suspendedAt).toLocaleDateString()
                    : t('userDetail.unknownDate')}
                </span>
              </div>
              {user.suspensionExpiresAt && (
                <div className="user-detail-info-item">
                  <span className="user-detail-label">
                    {t('userDetail.suspensionExpiresLabel')}:
                  </span>
                  <span className="user-detail-value">
                    {new Date(user.suspensionExpiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </>
          )}

          <div className="user-detail-info-item">
            <span className="user-detail-label">{t('userDetail.joinedLabel')}:</span>
            <span className="user-detail-value">
              {user.createdAt && !isNaN(new Date(user.createdAt))
                ? new Date(user.createdAt).toLocaleDateString()
                : t('userDetail.unknownDate')}
            </span>
          </div>

          <div className="user-detail-info-item">
            <span className="user-detail-label">{t('userDetail.relevantBookingsLabel')}:</span>
            <span className="user-detail-value">{user.bookings?.length || 0}</span>
          </div>

          <div className="user-detail-info-item">
            <span className="user-detail-label">{t('userDetail.reviewsLabel')}:</span>
            <span className="user-detail-value">{user.reviews?.length || 0}</span>
          </div>
        </div>

        <div className="user-detail-actions">
          <button
            onClick={handleToggleAdminClick}
            className={`user-detail-admin-button ${user.isAdmin ? 'remove' : 'grant'}`}
          >
            {user.isAdmin ? t('userDetail.removeAdminButton') : t('userDetail.makeAdminButton')}
          </button>
          <button
            onClick={handleToggleOwnerClick}
            className={`user-detail-owner-button ${user.isOwner ? 'remove' : 'grant'}`}
          >
            {user.isOwner ? t('userDetail.removeOwnerButton') : t('userDetail.makeOwnerButton')}
          </button>
          <button
            onClick={handleSuspensionClick}
            className={`user-detail-suspension-button ${user.isSuspended ? 'reactivate' : 'suspend'}`}
          >
            {user.isSuspended ? t('userDetail.reactivateButton') : t('userDetail.suspendButton')}
          </button>
        </div>
      </div>

      <div className="user-detail-tabs">
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          {t('userDetail.profileTab')}
        </button>
        <button
          className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          {t('userDetail.userBookingsTab', { count: user.bookings?.length || 0 })}
        </button>
        <button
          className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          {t('userDetail.reviewsTab', { count: user.reviews?.length || 0 })}
        </button>
      </div>

      <div className="user-detail-tab-content">
        {activeTab === 'profile' && (
          <div className="user-profile-tab">
            <h2>{t('userDetail.userProfileTab')}</h2>
            <p>{t('userDetail.userProfileDescription')}</p>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="user-bookings-tab">
            <h2>{t('userDetail.userBookingsTab')}</h2>
            <p className="user-bookings-note">{t('userDetail.userBookingsNote')}</p>
            {user.bookings && user.bookings.length > 0 ? (
              <div className="user-bookings-list">
                {user.bookings.map((booking) => (
                  <div key={booking._id} className="user-booking-item">
                    <div className="user-booking-header">
                      <span className="user-booking-title">{booking.campground.title}</span>
                      <span className="user-booking-dates">
                        {new Date(booking.startDate).toLocaleDateString()} -
                        {new Date(booking.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="user-booking-details">
                      <span>
                        {t('userDetail.daysLabel')}: {booking.totalDays}
                      </span>
                      <span className="user-booking-price">${booking.totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="user-booking-actions">
                      <Link
                        to={`/admin/bookings/${booking._id}`}
                        className="user-booking-view-button"
                      >
                        {t('userDetail.viewButton')}
                      </Link>
                      <button
                        onClick={() => handleCancelBookingClick(booking)}
                        className="user-booking-cancel-button"
                      >
                        {t('userDetail.cancelButton')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="user-no-data">{t('userDetail.noBookingsMessage')}</p>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="user-reviews-tab">
            <h2>{t('userDetail.userReviewsTab')}</h2>
            {user.reviews && user.reviews.length > 0 ? (
              <div className="user-reviews-list">
                {user.reviews.map((review) => (
                  <div key={review._id} className="user-review-item">
                    <div className="user-review-header">
                      <span className="user-review-campground">
                        {review.campground?.title ||
                          (review.campground?._id
                            ? t('userDetail.campgroundLabel')
                            : t('userDetail.campgroundLabel'))}
                      </span>
                      <div className="user-review-rating">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="user-review-body">{review.body}</p>
                    <div className="user-review-actions">
                      {review.campground?._id ? (
                        <Link
                          to={`/campgrounds/${review.campground._id}`}
                          className="user-review-view-button"
                        >
                          {t('userDetail.viewCampgroundButton')}
                        </Link>
                      ) : (
                        <span className="user-review-view-button disabled">
                          {t('userDetail.campgroundUnavailable')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="user-no-data">{t('userDetail.noReviewsMessage')}</p>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={adminDialog.open}
        onClose={handleToggleAdminCancel}
        onConfirm={handleToggleAdminConfirm}
        title={`${adminDialog.action === 'grant' ? t('userDetail.grantAdminTitle') : t('userDetail.removeAdminTitle')}`}
        message={`${t('userDetail.confirmAdminMessage', { action: adminDialog.action })}`}
        confirmLabel={
          adminDialog.action === 'grant'
            ? t('userDetail.grantAdminButton')
            : t('userDetail.removeAdminButton')
        }
        cancelLabel={t('userDetail.cancelButton')}
      />

      <ConfirmDialog
        open={ownerDialog.open}
        onClose={handleToggleOwnerCancel}
        onConfirm={handleToggleOwnerConfirm}
        title={`${ownerDialog.action === 'grant' ? t('userDetail.grantOwnerTitle') : t('userDetail.removeOwnerTitle')}`}
        message={`${t('userDetail.confirmOwnerMessage', { action: ownerDialog.action })}`}
        confirmLabel={
          ownerDialog.action === 'grant'
            ? t('userDetail.grantOwnerButton')
            : t('userDetail.removeOwnerButton')
        }
        cancelLabel={t('userDetail.cancelButton')}
      />

      <ConfirmDialog
        open={bookingDialog.open}
        onClose={handleCancelBookingCancel}
        onConfirm={handleCancelBookingConfirm}
        title={t('userDetail.cancelBookingTitle')}
        message={`${t('userDetail.confirmCancelBookingMessage', { username: user?.username })}`}
        confirmLabel={t('userDetail.cancelBookingButton')}
        cancelLabel={t('userDetail.keepBookingButton')}
      />

      <SuspensionDialog
        open={suspensionDialog.open}
        onClose={handleSuspensionCancel}
        onConfirm={handleSuspensionConfirm}
        action={suspensionDialog.action}
        username={user?.username}
      />
    </div>
  );
};

export default UserDetail;
