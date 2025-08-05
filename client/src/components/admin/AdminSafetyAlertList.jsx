import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@context/AuthContext';
import apiClient from '../../utils/api';
import { logError } from '@utils/logger';
import ConfirmDialog from '../common/ConfirmDialog';
import './AdminSafetyAlertList.css';

const AdminSafetyAlertList = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    type: '',
    campgroundId: '',
    requiresAcknowledgement: '',
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    alert: null,
  });
  const [stats, setStats] = useState({
    total: 0,
    requiresAcknowledgment: 0,
    totalAcknowledged: 0,
  });

  const fetchAlerts = async (page = 1, newFilters = filters) => {
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

      const response = await apiClient.get('/admin/safety-alerts', { params });
      const data = response.data.data || response.data;

      setAlerts(data.alerts || []);
      setPagination(data.pagination || {});

      // Calculate stats
      const alertsData = data.alerts || [];
      const totalAcknowledged = alertsData.reduce((sum, alert) => {
        return sum + (alert.acknowledgedBy?.length || 0);
      }, 0);

      setStats({
        total: alertsData.length,
        requiresAcknowledgment: alertsData.filter((alert) => alert.requiresAcknowledgement).length,
        totalAcknowledged,
      });
    } catch (err) {
      logError('Error fetching safety alerts', err);
      setError(err.response?.data?.message || 'Failed to load safety alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    fetchAlerts(1, newFilters);
  };

  const handlePageChange = (newPage) => {
    fetchAlerts(newPage);
  };

  const handleDeleteClick = (alert) => {
    setDeleteDialog({
      open: true,
      alert,
    });
  };

  const handleDeleteConfirm = async () => {
    const { alert } = deleteDialog;

    try {
      await apiClient.delete(`/admin/safety-alerts/${alert._id}`);

      // Remove the alert from the list
      setAlerts(alerts.filter((a) => a._id !== alert._id));

      // Show success message (you could add a toast notification here)

      // Close the dialog
      setDeleteDialog({ open: false, alert: null });
    } catch (err) {
      logError('Error deleting safety alert', err);
      setError(err.response?.data?.message || 'Failed to delete safety alert');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, alert: null });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'active';
      case 'resolved':
        return 'resolved';
      case 'expired':
        return 'expired';
      default:
        return 'active';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'weather':
        return '🌤️';
      case 'wildlife':
        return '🐻';
      case 'fire':
        return '🔥';
      case 'flood':
        return '🌊';
      case 'medical':
        return '🏥';
      case 'security':
        return '🔒';
      case 'maintenance':
        return '🔧';
      default:
        return '⚠️';
    }
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="admin-safety-alerts-unauthorized">
        <h2>{t('adminSafetyAlerts.accessDeniedTitle')}</h2>
        <p>{t('adminSafetyAlerts.accessDeniedMessage')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-safety-alerts-loading">
        {t('adminSafetyAlerts.loadingSafetyAlerts')}
      </div>
    );
  }

  if (error) {
    return <div className="admin-safety-alerts-error">{error}</div>;
  }

  return (
    <div className="admin-safety-alerts">
      <div className="admin-safety-alerts-header">
        <h1>{t('adminSafetyAlerts.safetyAlertsManagementTitle')}</h1>
        <p>{t('adminSafetyAlerts.safetyAlertsManagementDescription')}</p>
      </div>

      {/* Stats Summary */}
      <div className="admin-safety-alerts-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">{t('adminSafetyAlerts.totalAlertsLabel')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.requiresAcknowledgment}</div>
          <div className="stat-label">{t('adminSafetyAlerts.requiresAcknowledgmentLabel')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalAcknowledged}</div>
          <div className="stat-label">{t('adminSafetyAlerts.totalAcknowledgmentsLabel')}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-safety-alerts-filters">
        <div className="filter-group">
          <label htmlFor="status-filter">{t('adminSafetyAlerts.statusFilterLabel')}:</label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">{t('adminSafetyAlerts.allStatuses')}</option>
            <option value="active">{t('adminSafetyAlerts.active')}</option>
            <option value="resolved">{t('adminSafetyAlerts.resolved')}</option>
            <option value="expired">{t('adminSafetyAlerts.expired')}</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="severity-filter">{t('adminSafetyAlerts.severityFilterLabel')}:</label>
          <select
            id="severity-filter"
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
          >
            <option value="">{t('adminSafetyAlerts.allSeverities')}</option>
            <option value="critical">{t('adminSafetyAlerts.critical')}</option>
            <option value="high">{t('adminSafetyAlerts.high')}</option>
            <option value="medium">{t('adminSafetyAlerts.medium')}</option>
            <option value="low">{t('adminSafetyAlerts.low')}</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="type-filter">{t('adminSafetyAlerts.typeFilterLabel')}:</label>
          <select
            id="type-filter"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">{t('adminSafetyAlerts.allTypes')}</option>
            <option value="weather">{t('adminSafetyAlerts.weather')}</option>
            <option value="wildlife">{t('adminSafetyAlerts.wildlife')}</option>
            <option value="fire">{t('adminSafetyAlerts.fire')}</option>
            <option value="flood">{t('adminSafetyAlerts.flood')}</option>
            <option value="medical">{t('adminSafetyAlerts.medical')}</option>
            <option value="security">{t('adminSafetyAlerts.security')}</option>
            <option value="maintenance">{t('adminSafetyAlerts.maintenance')}</option>
            <option value="other">{t('adminSafetyAlerts.other')}</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="acknowledgment-filter">
            {t('adminSafetyAlerts.acknowledgmentFilterLabel')}:
          </label>
          <select
            id="acknowledgment-filter"
            value={filters.requiresAcknowledgement}
            onChange={(e) => handleFilterChange('requiresAcknowledgement', e.target.value)}
          >
            <option value="">{t('adminSafetyAlerts.allAlerts')}</option>
            <option value="true">{t('adminSafetyAlerts.requiresAcknowledgment')}</option>
            <option value="false">{t('adminSafetyAlerts.noAcknowledgmentRequired')}</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="admin-safety-alerts-list">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert._id} className="admin-safety-alert-item">
              <div className="alert-header">
                <div className="alert-type-icon">{getTypeIcon(alert.type)}</div>
                <div className="alert-title-section">
                  <h3 className="alert-title">{alert.title}</h3>
                  <div className="alert-meta">
                    <span className={`alert-severity ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className={`alert-status ${getStatusColor(alert.status)}`}>
                      {alert.status}
                    </span>
                    <span className="alert-type">{alert.type}</span>
                  </div>
                </div>
                <div className="alert-actions">
                  <button
                    onClick={() => handleDeleteClick(alert)}
                    className="alert-action-btn delete-btn"
                    title={t('adminSafetyAlerts.deleteSafetyAlertTitle')}
                  >
                    🗑️ {t('adminSafetyAlerts.delete')}
                  </button>
                </div>
              </div>

              <div className="alert-content">
                <p className="alert-description">{alert.description}</p>

                <div className="alert-details">
                  <div className="alert-location">
                    <strong>{t('location')}:</strong>{' '}
                    {alert.campground ? (
                      <Link to={`/campgrounds/${alert.campground._id}`}>
                        {alert.campground.title}
                      </Link>
                    ) : alert.campsite ? (
                      <span>{alert.campsite.name}</span>
                    ) : (
                      <span>{t('unknownLocation')}</span>
                    )}
                  </div>

                  <div className="alert-dates">
                    <span>
                      <strong>{t('startDate')}:</strong>{' '}
                      {new Date(alert.startDate).toLocaleDateString()}
                    </span>
                    <span>
                      <strong>{t('endDate')}:</strong>{' '}
                      {new Date(alert.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="alert-created-by">
                    <strong>{t('createdBy')}:</strong>{' '}
                    {alert.createdBy?.username || t('unknownUser')}
                  </div>

                  {alert.requiresAcknowledgement && (
                    <div className="alert-acknowledgment">
                      <div className="acknowledgment-header">
                        <span className="acknowledgment-required">
                          ⚠️ {t('requiresAcknowledgment')}
                        </span>
                        <div className="acknowledgment-progress">
                          <span className="acknowledgment-count">
                            {alert.acknowledgedBy?.length || 0} {t('acknowledged')}
                          </span>
                          <div className="acknowledgment-progress-bar">
                            <div
                              className="acknowledgment-progress-fill"
                              style={{
                                width: `${alert.acknowledgedBy?.length > 0 ? '100%' : '0%'}`,
                                backgroundColor:
                                  alert.acknowledgedBy?.length > 0 ? '#28a745' : '#dc3545',
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {alert.acknowledgedBy && alert.acknowledgedBy.length > 0 && (
                        <div className="acknowledgment-users">
                          <strong>{t('acknowledgedBy')}:</strong>
                          <div className="acknowledgment-user-list">
                            {alert.acknowledgedBy.map((ack, index) => (
                              <span key={ack._id || index} className="acknowledgment-user">
                                {ack.user?.username ||
                                  `User ID: ${ack.user?._id || t('unknownUser')}`}
                                {ack.acknowledgedAt && (
                                  <span className="acknowledgment-time">
                                    {' '}
                                    ({new Date(ack.acknowledgedAt).toLocaleDateString()})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {(!alert.acknowledgedBy || alert.acknowledgedBy.length === 0) && (
                        <div className="acknowledgment-none">
                          <span className="no-acknowledgments">{t('noAcknowledgments')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="admin-safety-alerts-empty">
            <p>{t('noSafetyAlertsFound')}</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="admin-safety-alerts-pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="pagination-btn"
          >
            {t('previous')}
          </button>

          <span className="pagination-info">
            {t('pageInfo', {
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
            {t('next')}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('deleteSafetyAlertTitle')}
        message={`${t('confirmDeleteMessage')}${deleteDialog.alert?.title}"? ${t('actionCannotBeUndone')}`}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
      />
    </div>
  );
};

export default AdminSafetyAlertList;
