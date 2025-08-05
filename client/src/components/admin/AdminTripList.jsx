import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useAuth} from '@context/AuthContext';
import apiClient from '../../utils/api';
import {logError} from '@utils/logger';
import ConfirmDialog from '../common/ConfirmDialog';
import './AdminTripList.css';

const AdminTripList = () => {
  const { t } = useTranslation();
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

  const handleFilterChange = async (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    await fetchTrips(1, newFilters);
  };

  const handlePageChange = async (newPage) => {
    await fetchTrips(newPage);
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
      await fetchTrips(pagination.page);

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
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
        <h2>{t('adminTripList.unauthorizedMessage')}</h2>
        <p>{t('adminTripList.unauthorizedMessage')}</p>
      </div>
    );
  }

  if (loading) {
    return <div className="admin-trips-loading">{t('adminTripList.loadingTrips')}</div>;
  }

  if (error) {
    return <div className="admin-trips-error">{error}</div>;
  }

  return (
    <div className="admin-trips">
      <div className="admin-trips-header">
        <h1>{t('adminTripList.title')}</h1>
        <p>{t('adminTripList.description')}</p>
      </div>

      {/* Filters */}
      <div className="admin-trips-filters">
        <div className="filter-group">
          <label htmlFor="public-filter">{t('adminTripList.visibilityFilterLabel')}:</label>
          <select
            id="public-filter"
            value={filters.isPublic}
            onChange={(e) => handleFilterChange('isPublic', e.target.value)}
          >
            <option value="">{t('adminTripList.allTrips')}</option>
            <option value="true">{t('adminTripList.publicOnly')}</option>
            <option value="false">{t('adminTripList.privateOnly')}</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="user-filter">{t('adminTripList.userIdFilterLabel')}:</label>
          <input
            id="user-filter"
            type="text"
            placeholder={t('adminTripList.enterUserIdPlaceholder')}
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
                      {trip.isPublic
                        ? t('adminTripList.publicTrip')
                        : t('adminTripList.privateTrip')}
                    </span>
                    <span className="trip-duration">
                      📅 {getTripDuration(trip.startDate, trip.endDate)} {t('adminTripList.days')}
                    </span>
                    <span className="trip-activities">
                      🎯 {getTotalActivities(trip)} {t('adminTripList.activities')}
                    </span>
                  </div>
                </div>
                <div className="trip-actions">
                  <Link to={`/admin/trips/${trip._id}`} className="trip-action-btn view-btn">
                    {t('adminTripList.viewDetails')}
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(trip)}
                    className="trip-action-btn delete-btn"
                  >
                    {t('adminTripList.delete')}
                  </button>
                </div>
              </div>

              <div className="trip-content">
                <div className="trip-description">{trip.description}</div>
                <div className="trip-details">
                  <div className="trip-dates">
                    <strong>{t('adminTripList.startDate')}:</strong> {formatDate(trip.startDate)}
                    <br />
                    <strong>{t('adminTripList.endDate')}:</strong> {formatDate(trip.endDate)}
                  </div>
                  <div className="trip-owner">
                    <strong>{t('adminTripList.owner')}:</strong>{' '}
                    <a href={`mailto:${trip.user?.email}`}>
                      {trip.user?.username || t('adminTripList.unknownUser')}
                    </a>
                  </div>
                  {trip.collaborators && trip.collaborators.length > 0 && (
                    <div className="trip-collaborators">
                      <strong>{t('adminTripList.collaborators')}:</strong>{' '}
                      {trip.collaborators.map((collaborator, index) => (
                        <a key={collaborator._id} href={`mailto:${collaborator.email}`}>
                          {collaborator.username}
                          {index < trip.collaborators.length - 1 ? ', ' : ''}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="trip-stats">
                    <strong>{t('adminTripList.createdAt')}:</strong> {formatDate(trip.createdAt)}
                  </div>
                </div>

                {trip.days && trip.days.length > 0 && (
                  <div className="trip-days-preview">
                    <h4>{t('adminTripList.tripDaysPreview')}</h4>
                    <div className="days-grid">
                      {trip.days.slice(0, 3).map((day, index) => (
                        <div key={index} className="day-preview">
                          <div className="day-date">
                            {t('adminTripList.day')} {index + 1}
                          </div>
                          <div className="day-activities-count">
                            {day.activities ? day.activities.length : 0}{' '}
                            {t('adminTripList.activities')}
                          </div>
                        </div>
                      ))}
                      {trip.days.length > 3 && (
                        <div className="more-days">
                          +{trip.days.length - 3} {t('adminTripList.moreDays')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="admin-trips-empty">
            <p>{t('adminTripList.noTripsFound')}</p>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="admin-trips-pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="pagination-btn"
          >
            {t('adminTripList.previous')}
          </button>

          <span className="pagination-info">
            {t('adminTripList.pageInfo', {
              page: pagination.page,
              totalPages: pagination.totalPages,
              total: pagination.total,
            })}
          </span>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="pagination-btn"
          >
            {t('adminTripList.next')}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('adminTripList.deleteTripTitle')}
        message={t('adminTripList.deleteTripConfirmMessage', {
          tripTitle: deleteDialog.trip?.title,
        })}
        confirmLabel={t('adminTripList.delete')}
        cancelLabel={t('adminTripList.cancel')}
      />
    </div>
  );
};

export default AdminTripList;
