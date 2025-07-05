import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useFlashMessage } from '../context/FlashMessageContext';
import useOwners from '../hooks/useOwners';
import apiClient from '../utils/api';
import { logError } from '../utils/logger';
import './OwnerBookingsPage.css';

/**
 * Owner Bookings Page
 * Allows campground owners to manage bookings for their campgrounds
 */
const OwnerBookingsPage = () => {
  const { showMessage } = useFlashMessage();
  const { useOwnerBookings } = useOwners();
  const [searchParams, setSearchParams] = useSearchParams();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [campgroundFilter, setCampgroundFilter] = useState('all');

  // Fetch owner's bookings
  const {
    data: bookingsData,
    isLoading,
    error: fetchError,
    refetch,
  } = useOwnerBookings({
    page: pagination.page,
    limit: pagination.limit,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    campground: campgroundFilter !== 'all' ? campgroundFilter : undefined,
  });

  useEffect(() => {
    if (bookingsData) {
      setBookings(bookingsData.bookings || []);
      setPagination(bookingsData.pagination || pagination);
      setLoading(false);
      setError(null);
    }
  }, [bookingsData]);

  useEffect(() => {
    if (fetchError) {
      setError('Failed to load bookings. Please try again later.');
      setLoading(false);
    }
  }, [fetchError]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  // Update URL when status filter changes
  useEffect(() => {
    if (statusFilter !== 'all') {
      setSearchParams({ status: statusFilter });
    } else {
      setSearchParams({});
    }
  }, [statusFilter, setSearchParams]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination({ ...pagination, page: newPage });
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleCampgroundChange = (e) => {
    setCampgroundFilter(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await apiClient.patch(`/owner/bookings/${bookingId}/status`, { status: newStatus });

      showMessage(`Booking ${newStatus} successfully`, 'success');

      // Update the booking in the local state
      setBookings(
        bookings.map((booking) =>
          booking._id === bookingId ? { ...booking, status: newStatus } : booking
        )
      );

      refetch();
    } catch (err) {
      logError('Error updating booking status', err);
      showMessage('Failed to update booking status. Please try again.', 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-default';
    }
  };

  const getBookingStats = () => {
    const stats = {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === 'pending').length,
      confirmed: bookings.filter((b) => b.status === 'confirmed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      completed: bookings.filter((b) => b.status === 'completed').length,
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="owner-loading">
        <div className="owner-loading-spinner"></div>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-error">
        <h4>Error Loading Bookings</h4>
        <p>{error}</p>
        <button onClick={() => refetch()} className="owner-btn owner-btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const stats = getBookingStats();

  return (
    <div className="owner-bookings">
      {/* Page Header */}
      <div className="owner-page-header">
        <div className="header-content">
          <div>
            <h1>Booking Management</h1>
            <p>Manage reservations for your campgrounds</p>
          </div>
          <div className="header-actions">
            <select
              value={pagination.limit}
              onChange={(e) =>
                setPagination({ ...pagination, page: 1, limit: Number(e.target.value) })
              }
              className="owner-select"
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="booking-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card confirmed">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.confirmed}</div>
          <div className="stat-label">Confirmed</div>
        </div>
        <div className="stat-card completed">
          <div className="stat-icon">🏁</div>
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="owner-card">
        <div className="filters-section">
          <h3>Filters</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="statusFilter">Status:</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={handleStatusChange}
                className="owner-select"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="campgroundFilter">Campground:</label>
              <select
                id="campgroundFilter"
                value={campgroundFilter}
                onChange={handleCampgroundChange}
                className="owner-select"
              >
                <option value="all">All Campgrounds</option>
                {/* This would be populated with owner's campgrounds */}
              </select>
            </div>
          </div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No Bookings Found</h3>
          <p>
            {statusFilter !== 'all'
              ? `No ${statusFilter} bookings found. Try adjusting your filters.`
              : "You don't have any bookings yet. Bookings will appear here once guests start booking your campgrounds."}
          </p>
          {statusFilter !== 'all' && (
            <button onClick={() => setStatusFilter('all')} className="owner-btn owner-btn-outline">
              Show All Bookings
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Bookings Table */}
          <div className="owner-card">
            <div className="table-container">
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Guest</th>
                    <th>Campground</th>
                    <th>Campsite</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Guests</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>
                        <div className="booking-id">
                          <strong>#{booking._id.substring(0, 8)}</strong>
                          <span className="booking-date">{formatDate(booking.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="guest-info">
                          <strong>{booking.user?.username || 'Unknown'}</strong>
                          <span className="guest-email">{booking.user?.email}</span>
                        </div>
                      </td>
                      <td>
                        <div className="campground-info">
                          <strong>{booking.campground?.title || 'Unknown'}</strong>
                          <span className="campground-location">
                            {booking.campground?.location}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="campsite-name">{booking.campsite?.name || 'N/A'}</span>
                      </td>
                      <td>{formatDate(booking.startDate)}</td>
                      <td>{formatDate(booking.endDate)}</td>
                      <td>
                        <span className="guest-count">{booking.numberOfGuests || 1}</span>
                      </td>
                      <td>
                        <strong className="booking-total">
                          {formatCurrency(booking.totalPrice)}
                        </strong>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                          {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) ||
                            'Pending'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <Link
                            to={`/owner/bookings/${booking._id}`}
                            className="owner-btn owner-btn-secondary owner-btn-sm"
                            title="View details"
                          >
                            👁️
                          </Link>
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                                className="owner-btn owner-btn-primary owner-btn-sm"
                                title="Confirm booking"
                              >
                                ✅
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                                className="owner-btn owner-btn-danger owner-btn-sm"
                                title="Cancel booking"
                              >
                                ❌
                              </button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusUpdate(booking._id, 'completed')}
                              className="owner-btn owner-btn-outline owner-btn-sm"
                              title="Mark as completed"
                            >
                              🏁
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="owner-pagination">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
                className="owner-btn owner-btn-outline"
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="owner-btn owner-btn-outline"
              >
                Previous
              </button>

              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages}({pagination.total} total bookings)
              </span>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="owner-btn owner-btn-outline"
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page >= pagination.totalPages}
                className="owner-btn owner-btn-outline"
              >
                Last
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OwnerBookingsPage;
