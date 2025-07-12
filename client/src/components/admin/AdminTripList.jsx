import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/api';
import { logError } from '../../utils/logger';
import ConfirmDialog from '../common/ConfirmDialog';
import './AdminTripList.css';

const AdminTripList = () => {
  const { currentUser } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    userId: '',
    isPublic: '',
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    trip: null,
  });

  const fetchTrips = async (page = 1, newFilters = filters) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: pagination.limit,
        ...newFilters,
      };

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await apiClient.get('/admin/trips', { params });
      const data = response.data.data || response.data;

      setTrips(data.trips || []);
      setPagination(data.pagination || {});
    } catch (err) {
      logError('Error fetching trips', err);
      setError(err.response?.data?.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    fetchTrips(1, newFilters);
  };

  const handlePageChange = (newPage) => {
    fetchTrips(newPage);
  };

  const handleDeleteClick = (trip) => {
    setDeleteDialog({
      open: true,
      trip,
    });
  };

  const handleDeleteConfirm = async () => {
    const { trip } = deleteDialog;

    try {
      await apiClient.delete(`/admin/trips/${trip._id}`);
      // Refresh the trips list
      fetchTrips(pagination.page);

      // Close the dialog
      setDeleteDialog({ open: false, trip: null });
    } catch (err) {
      logError('Error deleting trip', err);
      setError(err.response?.data?.message || 'Failed to delete trip');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, trip: null });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTripDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTotalActivities = (trip) => {
    if (!trip.days || !Array.isArray(trip.days)) return 0;
    return trip.days.reduce((total, day) => {
      return total + (day.activities ? day.activities.length : 0);
    }, 0);
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="admin-trips-unauthorized">
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="admin-trips-loading">Loading trips...</div>;
  }

  if (error) {
    return <div className="admin-trips-error">{error}</div>;
  }

  return (
    <div className="admin-trips">
      <div className="admin-trips-header">
        <h1>Trip Management</h1>
        <p>Monitor and manage user trips and trip-related activities</p>
      </div>

      {/* Filters */}
      <div className="admin-trips-filters">
        <div className="filter-group">
          <label htmlFor="public-filter">Visibility:</label>
          <select
            id="public-filter"
            value={filters.isPublic}
            onChange={(e) => handleFilterChange('isPublic', e.target.value)}
          >
            <option value="">All Trips</option>
            <option value="true">Public Only</option>
            <option value="false">Private Only</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="user-filter">User ID:</label>
          <input
            id="user-filter"
            type="text"
            placeholder="Enter user ID"
            value={filters.userId}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
          />
        </div>
      </div>

      {/* Trips List */}
      <div className="admin-trips-list">
        {trips.length > 0 ? (
          trips.map((trip) => (
            <div key={trip._id} className="admin-trip-item">
              <div className="trip-header">
                <div className="trip-title-section">
                  <h3 className="trip-title">{trip.title}</h3>
                  <div className="trip-meta">
                    <span className={`trip-visibility ${trip.isPublic ? 'public' : 'private'}`}>
                      {trip.isPublic ? '🌍 Public' : '🔒 Private'}
                    </span>
                    <span className="trip-duration">
                      📅 {getTripDuration(trip.startDate, trip.endDate)} days
                    </span>
                    <span className="trip-activities">
                      🎯 {getTotalActivities(trip)} activities
                    </span>
                  </div>
                </div>
                <div className="trip-actions">
                  <Link to={`/admin/trips/${trip._id}`} className="trip-action-btn view-btn">
                    View Details
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(trip)}
                    className="trip-action-btn delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="trip-content">
                {trip.description && <p className="trip-description">{trip.description}</p>}

                <div className="trip-details">
                  <div className="trip-dates">
                    <span>
                      <strong>Start:</strong> {formatDate(trip.startDate)}
                    </span>
                    <span>
                      <strong>End:</strong> {formatDate(trip.endDate)}
                    </span>
                  </div>

                  <div className="trip-owner">
                    <strong>Owner:</strong>{' '}
                    <Link to={`/admin/users/${trip.user._id}`}>{trip.user.username}</Link>
                    <span className="user-email">({trip.user.email})</span>
                  </div>

                  {trip.collaborators && trip.collaborators.length > 0 && (
                    <div className="trip-collaborators">
                      <strong>Collaborators:</strong>{' '}
                      {trip.collaborators.map((collaborator, index) => (
                        <span key={collaborator._id}>
                          <Link to={`/admin/users/${collaborator._id}`}>
                            {collaborator.username}
                          </Link>
                          {index < trip.collaborators.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="trip-stats">
                    <span>
                      <strong>Days:</strong> {trip.days ? trip.days.length : 0}
                    </span>
                    <span>
                      <strong>Created:</strong> {formatDate(trip.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Trip Days Preview */}
                {trip.days && trip.days.length > 0 && (
                  <div className="trip-days-preview">
                    <h4>Trip Days Preview:</h4>
                    <div className="days-grid">
                      {trip.days.slice(0, 3).map((day, index) => (
                        <div key={day._id || index} className="day-preview">
                          <div className="day-date">
                            Day {index + 1}: {formatDate(day.date)}
                          </div>
                          <div className="day-activities-count">
                            {day.activities ? day.activities.length : 0} activities
                          </div>
                        </div>
                      ))}
                      {trip.days.length > 3 && (
                        <div className="more-days">+{trip.days.length - 3} more days</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="admin-trips-empty">
            <p>No trips found matching the current filters.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="admin-trips-pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="pagination-btn"
          >
            Previous
          </button>

          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total trips)
          </span>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Trip"
        message={`Are you sure you want to delete "${deleteDialog.trip?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default AdminTripList;
