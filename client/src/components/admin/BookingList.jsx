import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/api';
import { logError } from '../../utils/logger';
import ConfirmDialog from '../common/ConfirmDialog';
import './BookingList.css';

/**
 * BookingList component displays a list of all bookings for administrators
 *
 * @returns {JSX.Element} Booking list component
 */
const BookingList = ({ initialBookings = [] }) => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [sort, setSort] = useState({
    field: 'startDate',
    order: 'desc',
  });
  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    booking: null,
  });

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          page: pagination.page,
          limit: pagination.limit,
          sortField: sort.field,
          sortOrder: sort.order,
        });

        const response = await apiClient.get(`/admin/bookings?${queryParams}`);
        // Handle the ApiResponse format
        const responseData = response.data;
        const data = responseData.data || responseData; // Handle both ApiResponse format and direct data
        setBookings(data.bookings || []);
        setPagination(data.pagination || pagination);
        setSort(data.sort || sort);
        setError(null);
      } catch (err) {
        logError('Error fetching bookings', err);
        setError(t('bookingList.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.isAdmin) {
      fetchBookings();
    }
  }, [pagination.page, pagination.limit, sort.field, sort.order, currentUser]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination({ ...pagination, page: newPage });
  };

  const handleSortChange = (field) => {
    // If clicking the same field, toggle order
    const newOrder = field === sort.field && sort.order === 'asc' ? 'desc' : 'asc';
    setSort({ field, order: newOrder });
  };

  const handleCancelClick = (booking) => {
    setCancelDialog({
      open: true,
      booking,
    });
  };

  const handleCancelConfirm = async () => {
    const { booking } = cancelDialog;

    try {
      await apiClient.delete(`/admin/bookings/${booking._id}`);

      // Remove the booking from the list
      setBookings(bookings.filter((b) => b._id !== booking._id));

      // Update pagination if needed
      if (bookings.length === 1 && pagination.page > 1) {
        setPagination({ ...pagination, page: pagination.page - 1 });
      }

      // Close the dialog
      setCancelDialog({ open: false, booking: null });
    } catch (err) {
      logError('Error canceling booking', err);
      alert(t('bookingList.cancelError'));
    }
  };

  const handleCancelCancel = () => {
    setCancelDialog({ open: false, booking: null });
  };

  // Format date to local string
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString();
  };

  if (!currentUser?.isAdmin) {
    return <div className="booking-list-unauthorized">{t('bookingList.unauthorizedMessage')}</div>;
  }

  if (loading) {
    return <div className="booking-list-loading">{t('bookingList.loading')}</div>;
  }

  if (error) {
    return <div className="booking-list-error">{error}</div>;
  }

  return (
    <div className="booking-list">
      <div className="booking-list-header">
        <h1>{t('bookingList.managementTitle')}</h1>
        <div className="booking-list-actions">
          <select
            value={pagination.limit}
            onChange={(e) =>
              setPagination({ ...pagination, page: 1, limit: Number(e.target.value) })
            }
            className="booking-list-limit"
          >
            <option value="5">{t('bookingList.limitOptions.5')}</option>
            <option value="10">{t('bookingList.limitOptions.10')}</option>
            <option value="25">{t('bookingList.limitOptions.25')}</option>
            <option value="50">{t('bookingList.limitOptions.50')}</option>
          </select>
        </div>
      </div>

      <div className="booking-list-table-container">
        <table className="booking-list-table">
          <thead>
            <tr>
              <th
                className={`sortable ${sort.field === 'campground.title' ? `sorted-${sort.order}` : ''}`}
                onClick={() => handleSortChange('campground.title')}
              >
                {t('bookingList.table.campground')}
              </th>
              <th
                className={`sortable ${sort.field === 'user.username' ? `sorted-${sort.order}` : ''}`}
                onClick={() => handleSortChange('user.username')}
              >
                {t('bookingList.table.user')}
              </th>
              <th
                className={`sortable ${sort.field === 'startDate' ? `sorted-${sort.order}` : ''}`}
                onClick={() => handleSortChange('startDate')}
              >
                {t('bookingList.table.checkIn')}
              </th>
              <th
                className={`sortable ${sort.field === 'endDate' ? `sorted-${sort.order}` : ''}`}
                onClick={() => handleSortChange('endDate')}
              >
                {t('bookingList.table.checkOut')}
              </th>
              <th>{t('bookingList.table.nights')}</th>
              <th
                className={`sortable ${sort.field === 'totalPrice' ? `sorted-${sort.order}` : ''}`}
                onClick={() => handleSortChange('totalPrice')}
              >
                {t('bookingList.table.totalPrice')}
              </th>
              <th
                className={`sortable ${sort.field === 'createdAt' ? `sorted-${sort.order}` : ''}`}
                onClick={() => handleSortChange('createdAt')}
              >
                {t('bookingList.table.bookedOn')}
              </th>
              <th>{t('bookingList.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking._id}>
                <td>
                  {booking.campground ? (
                    <Link to={`/campgrounds/${booking.campground._id}`}>
                      {booking.campground.title}
                    </Link>
                  ) : (
                    <span>{t('bookingList.table.campgroundPlaceholder')}</span>
                  )}
                </td>
                <td>
                  {booking.user ? (
                    <Link to={`/admin/users/${booking.user._id}`}>{booking.user.username}</Link>
                  ) : (
                    <span>{t('bookingList.table.unknownUser')}</span>
                  )}
                </td>
                <td>{formatDate(booking.startDate)}</td>
                <td>{formatDate(booking.endDate)}</td>
                <td>{booking.totalDays}</td>
                <td>${booking.totalPrice.toFixed(2)}</td>
                <td>{formatDate(booking.createdAt)}</td>
                <td className="booking-list-actions-cell">
                  <Link to={`/bookings/${booking._id}`} className="booking-list-view-button">
                    {t('bookingList.actions.view')}
                  </Link>
                  <button
                    onClick={() => handleCancelClick(booking)}
                    className="booking-list-cancel-button"
                  >
                    {t('bookingList.actions.cancel')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="booking-list-pagination">
          <button
            onClick={() => handlePageChange(1)}
            disabled={pagination.page === 1}
            className="pagination-button"
          >
            {t('bookingList.pagination.first')}
          </button>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="pagination-button"
          >
            {t('bookingList.pagination.previous')}
          </button>
          <span className="pagination-info">
            {t('bookingList.pagination.pageInfo', {
              page: pagination.page,
              totalPages: pagination.totalPages,
            })}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="pagination-button"
          >
            {t('bookingList.pagination.next')}
          </button>
          <button
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={pagination.page === pagination.totalPages}
            className="pagination-button"
          >
            {t('bookingList.pagination.last')}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={cancelDialog.open}
        onClose={handleCancelCancel}
        onConfirm={handleCancelConfirm}
        title={t('bookingList.cancelDialog.title')}
        message={t('bookingList.cancelDialog.message')}
        confirmLabel={t('bookingList.cancelDialog.confirmLabel')}
        cancelLabel={t('bookingList.cancelDialog.cancelLabel')}
      />
    </div>
  );
};

export default BookingList;
