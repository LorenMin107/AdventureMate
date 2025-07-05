import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/api';
import { logError } from '../../utils/logger';
import './BookingList.css';

/**
 * BookingList component displays a paginated list of bookings for administrators
 *
 * @returns {JSX.Element} Booking list component
 */
const BookingList = () => {
  const { currentUser } = useAuth();
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
        setError('Failed to load bookings. Please try again later.');
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

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await apiClient.delete(`/admin/bookings/${bookingId}`);

      // Remove the booking from the list
      setBookings(bookings.filter((booking) => booking._id !== bookingId));

      // Update pagination if needed
      if (bookings.length === 1 && pagination.page > 1) {
        setPagination({ ...pagination, page: pagination.page - 1 });
      }
    } catch (err) {
      logError('Error canceling booking', err);
      alert('Failed to cancel booking. Please try again later.');
    }
  };

  // Format date to local string
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString();
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="booking-list-unauthorized">
        You do not have permission to access this page.
      </div>
    );
  }

  if (loading) {
    return <div className="booking-list-loading">Loading bookings...</div>;
  }

  if (error) {
    return <div className="booking-list-error">{error}</div>;
  }

  return (
    <div className="booking-list">
      <div className="booking-list-header">
        <h1>Booking Management</h1>
        <div className="booking-list-actions">
          <select
            value={pagination.limit}
            onChange={(e) =>
              setPagination({ ...pagination, page: 1, limit: Number(e.target.value) })
            }
            className="booking-list-limit"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
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
                Campground
              </th>
              <th
                className={`sortable ${sort.field === 'user.username' ? `sorted-${sort.order}` : ''}`}
                onClick={() => handleSortChange('user.username')}
              >
                User
              </th>
              <th
                className={`sortable ${sort.field === 'startDate' ? `sorted-${sort.order}` : ''}`}
                onClick={() => handleSortChange('startDate')}
              >
                Check-in
              </th>
              <th
                className={`sortable ${sort.field === 'endDate' ? `sorted-${sort.order}` : ''}`}
                onClick={() => handleSortChange('endDate')}
              >
                Check-out
              </th>
              <th>Nights</th>
              <th
                className={`sortable ${sort.field === 'totalPrice' ? `sorted-${sort.order}` : ''}`}
                onClick={() => handleSortChange('totalPrice')}
              >
                Total Price
              </th>
              <th
                className={`sortable ${sort.field === 'createdAt' ? `sorted-${sort.order}` : ''}`}
                onClick={() => handleSortChange('createdAt')}
              >
                Booked On
              </th>
              <th>Actions</th>
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
                    <span>Campground</span>
                  )}
                </td>
                <td>
                  {booking.user ? (
                    <Link to={`/admin/users/${booking.user._id}`}>{booking.user.username}</Link>
                  ) : (
                    <span>Unknown user</span>
                  )}
                </td>
                <td>{formatDate(booking.startDate)}</td>
                <td>{formatDate(booking.endDate)}</td>
                <td>{booking.totalDays}</td>
                <td>${booking.totalPrice.toFixed(2)}</td>
                <td>{formatDate(booking.createdAt)}</td>
                <td className="booking-list-actions-cell">
                  <Link to={`/bookings/${booking._id}`} className="booking-list-view-button">
                    View
                  </Link>
                  <button
                    onClick={() => handleCancelBooking(booking._id)}
                    className="booking-list-cancel-button"
                  >
                    Cancel
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
            First
          </button>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="pagination-button"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={pagination.page === pagination.totalPages}
            className="pagination-button"
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingList;
