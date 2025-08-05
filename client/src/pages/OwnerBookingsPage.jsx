import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFlashMessage } from '../context/FlashMessageContext';
import { useTheme } from '../context/ThemeContext';
import useOwners from '../hooks/useOwners';
import apiClient from '../utils/api';
import { logError } from '../utils/logger';
import CSSIsolationWrapper from '../components/CSSIsolationWrapper';
import './OwnerBookingsPage.css';

/**
 * Owner Bookings Page
 * Modern dashboard for campground owners to manage bookings
 */
const OwnerBookingsPage = () => {
  const { t } = useTranslation();
  const { showMessage } = useFlashMessage();
  const { theme } = useTheme();
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
      setError(t('ownerBookings.errorTitle'));
      setLoading(false);
    }
  }, [fetchError, t]);

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
      // Show loading message
      showMessage(t('ownerBookings.updatingStatus'), 'info');

      const response = await apiClient.patch(`/owner/bookings/${bookingId}/status`, {
        status: newStatus,
      });

      showMessage(t('ownerBookings.statusUpdated', { status: newStatus }), 'success');

      // Update the booking in the local state
      setBookings(
        bookings.map((booking) =>
          booking._id === bookingId ? { ...booking, status: newStatus } : booking
        )
      );

      // Refetch to get updated data
      await refetch();
    } catch (err) {
      console.error('Error updating booking status:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
      });

      logError('Error updating booking status', err);

      // Show more specific error message
      const errorMessage =
        err.response?.data?.message || err.message || t('ownerBookings.updateError');
      showMessage(errorMessage, 'error');
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

  const isBookingPast = (endDate) => {
    return new Date(endDate) < new Date();
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
      <CSSIsolationWrapper section="owner" className="owner-loading">
        <div className="owner-loading-spinner"></div>
        <p>{t('ownerBookings.loading')}</p>
      </CSSIsolationWrapper>
    );
  }

  if (error) {
    return (
      <CSSIsolationWrapper section="owner" className="owner-error">
        <h4>{t('ownerBookings.errorTitle')}</h4>
        <p>{error}</p>
        <button onClick={async () => await refetch()} className="owner-btn owner-btn-primary">
          {t('ownerBookings.retry')}
        </button>
      </CSSIsolationWrapper>
    );
  }

  const stats = getBookingStats();

  return (
    <CSSIsolationWrapper
      section="owner"
      className={`owner-bookings ${theme === 'dark' ? 'dark-theme' : ''}`}
    >
      {/* Enhanced Page Header */}
      <div className="owner-page-header">
        <div className="header-content">
          <div className="header-main">
            <div className="greeting-section">
              <h1>{t('ownerBookings.bookingManagement')}</h1>
              <p className="header-subtitle">
                {t('ownerBookings.manageReservationsTrackPerformance')}
              </p>
            </div>
            <div className="header-stats">
              <div className="header-stat">
                <span className="stat-label">{t('ownerBookings.totalBookings')}</span>
                <span className="stat-value">{stats.total}</span>
              </div>
              <div className="header-stat">
                <span className="stat-label">{t('ownerBookings.pendingActions')}</span>
                <span className="stat-value">{stats.pending}</span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <div className="view-controls">
              <select
                value={pagination.limit}
                onChange={(e) =>
                  setPagination({ ...pagination, page: 1, limit: Number(e.target.value) })
                }
                className="owner-select"
              >
                <option value="10">{t('ownerBookings.perPage10')}</option>
                <option value="25">{t('ownerBookings.perPage25')}</option>
                <option value="50">{t('ownerBookings.perPage50')}</option>
                <option value="100">{t('ownerBookings.perPage100')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bookings-content">
        {/* Enhanced Stats Grid */}
        <div className="owner-stats-grid">
          <div className="owner-stat-card total-bookings-card">
            <div className="stat-header">
              <div className="stat-icon">📅</div>
              <div className="stat-trend">
                <span className="trend-indicator neutral">{t('ownerBookings.allTime')}</span>
              </div>
            </div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">{t('ownerBookings.totalBookings')}</div>
            <div className="stat-period">{t('ownerBookings.allTime')}</div>
          </div>

          <div className="owner-stat-card pending-bookings-card">
            <div className="stat-header">
              <div className="stat-icon">⏳</div>
              <div className="stat-trend">
                <span className="trend-indicator warning">{t('ownerBookings.needsAttention')}</span>
              </div>
            </div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">{t('ownerBookings.pendingReview')}</div>
            <div className="stat-period">{t('ownerBookings.awaitingConfirmation')}</div>
          </div>

          <div className="owner-stat-card confirmed-bookings-card">
            <div className="stat-header">
              <div className="stat-icon">✅</div>
              <div className="stat-trend">
                <span className="trend-indicator positive">{t('ownerBookings.confirmed')}</span>
              </div>
            </div>
            <div className="stat-value">{stats.confirmed}</div>
            <div className="stat-label">{t('ownerBookings.confirmed')}</div>
            <div className="stat-period">{t('ownerBookings.readyForGuests')}</div>
          </div>

          <div className="owner-stat-card completed-bookings-card">
            <div className="stat-header">
              <div className="stat-icon">🏁</div>
              <div className="stat-trend">
                <span className="trend-indicator success">{t('ownerBookings.completed')}</span>
              </div>
            </div>
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">{t('ownerBookings.completed')}</div>
            <div className="stat-period">{t('ownerBookings.pastStays')}</div>
          </div>

          <div className="owner-stat-card cancelled-bookings-card">
            <div className="stat-header">
              <div className="stat-icon">❌</div>
              <div className="stat-trend">
                <span className="trend-indicator negative">{t('ownerBookings.cancelled')}</span>
              </div>
            </div>
            <div className="stat-value">{stats.cancelled}</div>
            <div className="stat-label">{t('ownerBookings.cancelled')}</div>
            <div className="stat-period">{t('ownerBookings.cancelledBookings')}</div>
          </div>
        </div>

        {/* Enhanced Filters Section */}
        <div className="owner-card owner-filters-card">
          <div className="card-header">
            <div className="card-title">
              <h3>{t('ownerBookings.filterSearch')}</h3>
              <p className="card-subtitle">{t('ownerBookings.refineBookingView')}</p>
            </div>
          </div>
          <div className="card-content">
            <div className="filters-grid">
              <div className="filter-group">
                <label htmlFor="statusFilter">{t('ownerBookings.bookingStatus')}</label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={handleStatusChange}
                  className="owner-select"
                >
                  <option value="all">{t('ownerBookings.allStatuses')}</option>
                  <option value="pending">{t('ownerBookings.pending')}</option>
                  <option value="confirmed">{t('ownerBookings.confirmed')}</option>
                  <option value="completed">{t('ownerBookings.completed')}</option>
                  <option value="cancelled">{t('ownerBookings.cancelled')}</option>
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="campgroundFilter">{t('ownerBookings.campground')}</label>
                <select
                  id="campgroundFilter"
                  value={campgroundFilter}
                  onChange={handleCampgroundChange}
                  className="owner-select"
                >
                  <option value="all">{t('ownerBookings.allCampgrounds')}</option>
                  {/* This would be populated with owner's campgrounds */}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Content */}
        {bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>{t('ownerBookings.noBookingsFound')}</h3>
            <p>
              {statusFilter !== 'all'
                ? `${t('ownerBookings.no')} ${statusFilter} ${t('ownerBookings.bookingsFound')}. ${t('ownerBookings.tryAdjustingFilters')}`
                : `${t('ownerBookings.no')} ${t('ownerBookings.bookingsFound')}. ${t('ownerBookings.bookingsWillAppearHereOnceGuestsStartBooking')}`}
            </p>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="owner-btn owner-btn-outline"
              >
                {t('ownerBookings.showAllBookings')}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Enhanced Bookings Table */}
            <div className="owner-card owner-table-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>{t('ownerBookings.bookingListings')}</h3>
                  <p className="card-subtitle">
                    {t('ownerBookings.showing')} {bookings.length} {t('ownerBookings.of')}{' '}
                    {pagination.total} {t('ownerBookings.bookings')}
                  </p>
                </div>
              </div>
              <div className="card-content">
                <div className="table-container">
                  <table className="owner-table">
                    <thead>
                      <tr>
                        <th>{t('ownerBookings.guestBooking')}</th>
                        <th>{t('ownerBookings.campgroundSite')}</th>
                        <th>{t('ownerBookings.stayDetails')}</th>
                        <th>{t('ownerBookings.financial')}</th>
                        <th>{t('ownerBookings.status')}</th>
                        <th>{t('ownerBookings.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking._id}>
                          <td>
                            <div className="guest-booking-info">
                              <div className="guest-primary">
                                <div className="guest-name">
                                  <strong>
                                    {booking.user?.username || t('ownerBookings.unknown')}
                                  </strong>
                                </div>
                                <div className="guest-email">{booking.user?.email}</div>
                              </div>
                              <div className="booking-secondary">
                                <div className="booking-id">
                                  <small>#{booking._id.substring(0, 8)}</small>
                                </div>
                                <div className="booking-date">
                                  <small>
                                    {t('ownerBookings.created')} {formatDate(booking.createdAt)}
                                  </small>
                                </div>
                                <div className="guest-count">
                                  <small>
                                    {booking.numberOfGuests || 1} {t('ownerBookings.guest')}
                                    {(booking.numberOfGuests || 1) > 1 ? t('ownerBookings.s') : ''}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="campground-site-info">
                              <div className="campground-primary">
                                <div className="campground-name">
                                  <strong>
                                    {booking.campground?.title || t('ownerBookings.unknown')}
                                  </strong>
                                </div>
                                <div className="campground-location">
                                  📍 {booking.campground?.location}
                                </div>
                              </div>
                              <div className="campsite-info">
                                <div className="campsite-name">
                                  <small>
                                    🏕️ {booking.campsite?.name || t('ownerBookings.standardSite')}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="stay-details">
                              <div className="dates-primary">
                                <div className="check-in">
                                  <strong>{t('ownerBookings.checkIn')}:</strong>{' '}
                                  {formatDate(booking.startDate)}
                                </div>
                                <div className="check-out">
                                  <strong>{t('ownerBookings.checkOut')}:</strong>{' '}
                                  {formatDate(booking.endDate)}
                                </div>
                              </div>
                              <div className="stay-summary">
                                <div className="nights">
                                  <small>
                                    📅 {booking.totalDays || 1} {t('ownerBookings.night')}
                                    {(booking.totalDays || 1) > 1 ? t('ownerBookings.s') : ''}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="financial-summary">
                              <div className="amount-primary">
                                <div className="total-amount">
                                  <strong>{formatCurrency(booking.totalPrice)}</strong>
                                </div>
                              </div>
                              <div className="payment-info">
                                <div className="payment-status">
                                  {booking.paid ? (
                                    <span className="payment-paid">
                                      ✅ {t('ownerBookings.paid')}
                                    </span>
                                  ) : (
                                    <span className="payment-pending">
                                      ⏳ {t('ownerBookings.pending')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="status-cell">
                              <div className="status-primary">
                                <span
                                  className={`status-badge ${getStatusBadgeClass(booking.status)}`}
                                >
                                  {booking.status}
                                </span>
                              </div>
                              {isBookingPast(booking.endDate) &&
                                booking.status !== 'completed' &&
                                booking.status !== 'cancelled' && (
                                  <div className="past-booking-indicator">
                                    <small>⏰ {t('ownerBookings.pastDue')}</small>
                                  </div>
                                )}
                            </div>
                          </td>
                          <td>
                            <div className="actions-cell">
                              <div className="action-buttons">
                                {booking.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                                      className="owner-btn owner-btn-success owner-btn-small"
                                      title={t('ownerBookings.confirmBooking')}
                                    >
                                      {t('ownerBookings.confirm')} ✓
                                    </button>
                                    <button
                                      onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                                      className="owner-btn owner-btn-danger owner-btn-small"
                                      title={t('ownerBookings.declineBooking')}
                                    >
                                      {t('ownerBookings.decline')} ✗
                                    </button>
                                  </>
                                )}
                                <Link
                                  to={`/owner/bookings/${booking._id}`}
                                  className="owner-btn owner-btn-outline owner-btn-small"
                                  title={t('ownerBookings.viewDetails')}
                                >
                                  {t('ownerBookings.viewDetails')} 👁️
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Enhanced Pagination */}
            {pagination.totalPages > 1 && (
              <div className="owner-pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="owner-btn owner-btn-outline"
                >
                  {t('ownerBookings.previous')}
                </button>
                <div className="pagination-info">
                  {t('ownerBookings.page')} {pagination.page} {t('ownerBookings.of')}{' '}
                  {pagination.totalPages}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="owner-btn owner-btn-outline"
                >
                  {t('ownerBookings.next')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </CSSIsolationWrapper>
  );
};

export default OwnerBookingsPage;
