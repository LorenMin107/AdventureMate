import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import './AdminBookingList.css';

/**
 * AdminBookingList component displays a list of all bookings for admin users
 * 
 * @param {Object} props - Component props
 * @param {Array} props.initialBookings - Initial bookings data (optional)
 * @returns {JSX.Element} Admin booking list component
 */
const AdminBookingList = ({ initialBookings = [] }) => {
  const [bookings, setBookings] = useState(initialBookings);
  const [loading, setLoading] = useState(!initialBookings.length);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const { currentUser } = useAuth();

  // Early return for non-admin users
  if (!currentUser?.isAdmin) {
    return (
      <div className="admin-booking-list-unauthorized">
        You do not have permission to view this page.
      </div>
    );
  }

  // Effect to fetch bookings when component mounts or when page changes
  useEffect(() => {
    // If we have initial bookings, no need to fetch
    if (initialBookings.length > 0) {
      setBookings(initialBookings);
      setLoading(false);
      return;
    }

    const fetchBookings = async () => {
      try {
        setLoading(true);

        // Add status filter to the query if it's not 'all'
        const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
        const response = await fetch(`/api/admin/bookings?page=${page}&limit=${limit}${statusParam}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch bookings: ${response.status}`);
        }

        const data = await response.json();
        setBookings(data.bookings || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setError(null);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [page]); // Only depend on page changes

  if (loading) {
    return (
      <div className="admin-booking-list-loading">
        Loading bookings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-booking-list-error">
        <p>{error}</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="admin-booking-list-empty">
        <p>There are no bookings in the system yet.</p>
      </div>
    );
  }

  // Format date to local string
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="admin-booking-list">
      <h2 className="admin-booking-list-title">All Bookings</h2>

      <div className="admin-booking-list-filters">
        <div className="admin-booking-list-filter-group">
          <label htmlFor="statusFilter">Filter by Status:</label>
          <select 
            id="statusFilter" 
            value={statusFilter} 
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1); // Reset to first page when filter changes
            }}
            className="admin-booking-list-filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="admin-booking-list-table-container">
        <table className="admin-booking-list-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>User</th>
              <th>Campground</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Days</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking._id} className="admin-booking-list-item">
                <td className="admin-booking-list-id">
                  {booking._id.substring(0, 8)}...
                </td>
                <td className="admin-booking-list-user">
                  {booking.user.username}
                </td>
                <td className="admin-booking-list-campground">
                  {booking.campground.title}
                </td>
                <td>{formatDate(booking.startDate)}</td>
                <td>{formatDate(booking.endDate)}</td>
                <td>{booking.totalDays}</td>
                <td className="admin-booking-list-price">
                  ${booking.totalPrice.toFixed(2)}
                </td>
                <td>
                  <span className={`admin-booking-list-status admin-booking-list-status-${booking.status || 'pending'}`}>
                    {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending'}
                  </span>
                </td>
                <td>
                  <Link 
                    to={`/admin/bookings/${booking._id}`} 
                    className="admin-booking-list-view-button"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="admin-booking-list-pagination">
        <button 
          onClick={() => setPage(prev => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="admin-booking-list-pagination-button"
        >
          Previous
        </button>

        <span className="admin-booking-list-pagination-info">
          Page {page} of {totalPages}
        </span>

        <button 
          onClick={() => setPage(prev => prev < totalPages ? prev + 1 : prev)}
          disabled={page >= totalPages}
          className="admin-booking-list-pagination-button"
        >
          Next
        </button>
      </div>
    </div>
  );
};

AdminBookingList.propTypes = {
  initialBookings: PropTypes.array
};

export default AdminBookingList;
