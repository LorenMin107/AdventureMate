import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../utils/api';
import { logError, logInfo } from '../utils/logger';
import ConfirmDialog from './common/ConfirmDialog';
import './SafetyAlertList.css';

/**
 * SafetyAlertList component displays a list of safety alerts for a campground
 *
 * @param {Object} props - Component props
 * @param {string} props.campgroundId - ID of the campground
 * @param {Array} props.initialAlerts - Initial alerts data (optional)
 * @param {function} props.onAlertDeleted - Callback when an alert is deleted (optional)
 * @param {boolean} props.showActiveOnly - Whether to show only active alerts (default: true)
 * @returns {JSX.Element} Safety alert list component
 */
const SafetyAlertList = ({
  entityId,
  entityType = 'campground',
  initialAlerts = [],
  onAlertDeleted,
  onAlertAcknowledged,
  showActiveOnly = true,
  showAllForAcknowledgment = false, // New prop to show all alerts when acknowledgment is required
}) => {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [loading, setLoading] = useState(!initialAlerts.length);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    alert: null,
  });
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        setError(null);

        // If initialAlerts are provided, use them instead of fetching
        if (initialAlerts && initialAlerts.length > 0) {
          if (process.env.NODE_ENV === 'development') {
          }
          setAlerts(initialAlerts);
          setLoading(false);
          return;
        }

        // If showAllForAcknowledgment is true, always fetch all alerts (not just active ones)
        const shouldShowAll = showAllForAcknowledgment || !showActiveOnly;
        const endpoint = shouldShowAll ? '' : '/active';
        const entityPath = entityType === 'campsite' ? 'campsite-safety-alerts' : 'campgrounds';
        const url = `/${entityPath}/${entityId}/safety-alerts${endpoint}`;

        // Add cache-busting parameter to prevent 304 responses
        const response = await apiClient.get(url, {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
          params: {
            _t: Date.now(), // Add timestamp to prevent caching
          },
        });

        const responseData = response.data;
        // Debug logging removed for security
        const alertsToSet = responseData.data?.alerts || [];

        setAlerts(alertsToSet);
      } catch (err) {
        logError('Error fetching safety alerts', err);

        // If it's a 404 (campground not found) or other expected error, just show empty state
        if (err.response?.status === 404) {
          setAlerts([]);
        } else if (err.response?.status === 401) {
          // Authentication error - don't show error message, just empty state
          setAlerts([]);
          // We don't set an error here, so the component will just render empty
        } else {
          setError(t('safetyAlerts.list.error'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [entityId, entityType, showActiveOnly, showAllForAcknowledgment]);

  // Update alerts when initialAlerts change (for when parent component refreshes the merged alerts)
  useEffect(() => {
    if (initialAlerts && initialAlerts.length > 0) {
      // Debug logging removed for security
      setAlerts(initialAlerts);
    }
  }, [initialAlerts]);

  const handleDeleteClick = (alertId) => {
    const alert = alerts.find((a) => a._id === alertId);
    setDeleteDialog({
      open: true,
      alert,
    });
  };

  const handleDeleteConfirm = async () => {
    const { alert } = deleteDialog;

    try {
      // Determine the correct endpoint based on the alert's actual properties
      let deleteUrl;

      if (alert.campsite) {
        // This is a campsite-specific alert
        deleteUrl = `/campsite-safety-alerts/${alert.campsite}/safety-alerts/${alert._id}`;
      } else if (alert.campground) {
        // This is a campground-level alert
        const campgroundId =
          typeof alert.campground === 'object' ? alert.campground._id : alert.campground;
        deleteUrl = `/campgrounds/${campgroundId}/safety-alerts/${alert._id}`;
      } else {
        // Fallback to the current entity type
        const entityPath = entityType === 'campsite' ? 'campsite-safety-alerts' : 'campgrounds';
        deleteUrl = `/${entityPath}/${entityId}/safety-alerts/${alert._id}`;
      }

      await apiClient.delete(deleteUrl);

      // Update local state
      setAlerts(alerts.filter((a) => a._id !== alert._id));

      // Notify parent component
      if (onAlertDeleted) {
        onAlertDeleted(alert._id);
      }

      // Close the dialog
      setDeleteDialog({ open: false, alert: null });
    } catch (err) {
      logError('Error deleting safety alert', err);
      console.error('Error deleting safety alert:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, alert: null });
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      // Debug logging removed for security

      // Find the alert to determine if it's campsite-specific or campground-level
      const alert = alerts.find((a) => a._id === alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      // Determine the correct endpoint based on the alert's actual properties
      let acknowledgmentUrl;
      let refreshUrl;

      if (alert.campsite) {
        // This is a campsite-specific alert
        acknowledgmentUrl = `/campsite-safety-alerts/${alert.campsite}/safety-alerts/${alertId}/acknowledge`;
        const shouldShowAll = showAllForAcknowledgment || !showActiveOnly;
        const endpoint = shouldShowAll ? '' : '/active';
        refreshUrl = `/campsite-safety-alerts/${alert.campsite}/safety-alerts${endpoint}`;
      } else if (alert.campground) {
        // This is a campground-level alert
        const campgroundId =
          typeof alert.campground === 'object' ? alert.campground._id : alert.campground;
        acknowledgmentUrl = `/campgrounds/${campgroundId}/safety-alerts/${alertId}/acknowledge`;
        const shouldShowAll = showAllForAcknowledgment || !showActiveOnly;
        const endpoint = shouldShowAll ? '' : '/active';
        refreshUrl = `/campgrounds/${campgroundId}/safety-alerts${endpoint}`;
      } else {
        // Fallback to the current entity type
        const entityPath = entityType === 'campsite' ? 'campsite-safety-alerts' : 'campgrounds';
        acknowledgmentUrl = `/${entityPath}/${entityId}/safety-alerts/${alertId}/acknowledge`;
        const shouldShowAll = showAllForAcknowledgment || !showActiveOnly;
        const endpoint = shouldShowAll ? '' : '/active';
        refreshUrl = `/${entityPath}/${entityId}/safety-alerts${endpoint}`;
      }

      // Debug logging removed for security

      const response = await apiClient.post(acknowledgmentUrl);
      // Debug logging removed for security

      // Immediately update the local state to hide the acknowledge button
      setAlerts((prevAlerts) =>
        prevAlerts.map((alert) =>
          alert._id === alertId
            ? {
                ...alert,
                acknowledgedBy: [
                  ...(alert.acknowledgedBy || []),
                  {
                    user: currentUser._id,
                    acknowledgedAt: new Date().toISOString(),
                  },
                ],
              }
            : alert
        )
      );

      // Refresh the alerts to get the updated acknowledgment status
      // Debug logging removed for security

      const refreshResponse = await apiClient.get(refreshUrl, {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        params: {
          _t: Date.now(),
        },
      });

      const responseData = refreshResponse.data;
      const updatedAlerts = responseData.data?.alerts || [];
      // Debug logging removed for security
      setAlerts(updatedAlerts);

      // Notify parent component that an alert was acknowledged
      if (onAlertAcknowledged) {
        onAlertAcknowledged();
      }

      // Also trigger a re-fetch of alerts to ensure we have the latest data
      const shouldShowAll = showAllForAcknowledgment || !showActiveOnly;
      const endpoint = shouldShowAll ? '' : '/active';
      const entityPath = entityType === 'campsite' ? 'campsite-safety-alerts' : 'campgrounds';
      const url = `/${entityPath}/${entityId}/safety-alerts${endpoint}`;

      try {
        const finalRefreshResponse = await apiClient.get(url, {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
          params: {
            _t: Date.now(),
          },
        });

        const finalResponseData = finalRefreshResponse.data;
        const finalUpdatedAlerts = finalResponseData.data?.alerts || [];
        if (process.env.NODE_ENV === 'development') {
        }
        setAlerts(finalUpdatedAlerts);
      } catch (refreshErr) {
        console.error('Error in final refresh:', refreshErr);
      }
    } catch (err) {
      console.error('Acknowledgment error details:', err);
      logError('Error acknowledging safety alert', err);

      // Provide more detailed error information
      let errorMessage = t('commonErrors.failedToUpdate', { item: 'safety alert' });

      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const data = err.response.data;

        if (process.env.NODE_ENV === 'development') {
        }

        if (status === 404) {
          errorMessage = 'Safety alert not found. It may have been deleted.';
        } else if (status === 400) {
          if (data?.message === 'Already acknowledged') {
            // If already acknowledged, just refresh the data and don't show an error
            if (process.env.NODE_ENV === 'development') {
            }

            // Refresh the alerts to get the updated acknowledgment status
            const endpoint = showActiveOnly ? '/active' : '';
            const entityPath = entityType === 'campsite' ? 'campsite-safety-alerts' : 'campgrounds';
            const url = `/${entityPath}/${entityId}/safety-alerts${endpoint}`;

            try {
              const refreshResponse = await apiClient.get(url, {
                headers: {
                  'Cache-Control': 'no-cache',
                  Pragma: 'no-cache',
                },
                params: {
                  _t: Date.now(),
                },
              });

              const refreshData = refreshResponse.data;
              const refreshedAlerts = refreshData.data?.alerts || [];
              setAlerts(refreshedAlerts);

              // Don't show error, just return
              return;
            } catch (refreshErr) {
              console.error('Error refreshing alerts:', refreshErr);
            }
          }
          errorMessage = data?.message || 'Invalid request. Please check the alert details.';
        } else if (status === 403) {
          errorMessage = t('safetyAlertList.noPermission');
        } else if (status === 401) {
          errorMessage = t('safetyAlertList.loginRequired');
        } else {
          errorMessage = data?.message || t('safetyAlertList.serverError', { status });
        }
      } else if (err.request) {
        // Network error
        errorMessage = t('safetyAlertList.networkError');
      } else {
        // Other error
        errorMessage = err.message || t('safetyAlertList.unexpectedError');
      }

      alert(errorMessage);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#dc2626'; // red-600
      case 'high':
        return '#ea580c'; // orange-600
      case 'medium':
        return '#d97706'; // amber-600
      case 'low':
        return '#059669'; // emerald-600
      default:
        return '#6b7280'; // gray-500
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      case 'low':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'weather':
        return '🌦️';
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
        return '📢';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Modify the render logic to show a message for non-authenticated users when no alerts are available
  if (loading) {
    return (
      <div className={`safety-alert-list ${theme}`}>
        <div className="safety-alert-loading">{t('safetyAlerts.list.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`safety-alert-list ${theme}`}>
        <div className="safety-alert-error">{error}</div>
      </div>
    );
  }

  // Debug logging removed for security

  if (!alerts || alerts.length === 0) {
    // Check if user is authenticated
    if (!currentUser && !initialAlerts?.length) {
      return (
        <div className={`safety-alert-list ${theme}`}>
          <div className="safety-alert-empty">
            <p>{t('safetyAlerts.list.signInToView')}</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`safety-alert-list ${theme}`}>
        <div className="safety-alert-empty">
          <p>{t('safetyAlerts.list.noAlerts')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="safety-alert-list">
      <h3 className="safety-alert-list-title">
        {showActiveOnly && !showAllForAcknowledgment
          ? t('safetyAlerts.list.activeTitle', { count: alerts.length })
          : showAllForAcknowledgment
            ? t('safetyAlerts.list.allAlertsTitle', { count: alerts.length })
            : t('safetyAlerts.list.title', { count: alerts.length })}
      </h3>

      {alerts
        .filter((alert) => alert && typeof alert === 'object')
        .map((alert) => {
          const canDelete =
            currentUser &&
            alert.createdBy &&
            (currentUser.isAdmin || currentUser._id === alert.createdBy._id);

          // Check if user has already acknowledged this alert
          const userAcknowledged = currentUser
            ? (alert.acknowledgedBy || []).some((ack) => {
                if (!ack || !ack.user) return false;

                // Handle both populated user object and user ID string
                const ackUserId = typeof ack.user === 'object' ? ack.user?._id : ack.user;
                const currentUserId = currentUser._id;

                return ackUserId?.toString() === currentUserId?.toString();
              })
            : false;

          const canAcknowledge =
            currentUser && alert.requiresAcknowledgement === true && !userAcknowledged;

          // Debug logging removed for security

          return (
            <div
              key={alert._id || `alert-${Math.random()}`}
              className={`safety-alert-item severity-${alert.severity || 'medium'}`}
              style={{ borderLeftColor: getSeverityColor(alert.severity || 'medium') }}
            >
              <div className="safety-alert-header">
                <div className="safety-alert-title-section">
                  <span className="safety-alert-severity-icon">
                    {getSeverityIcon(alert.severity || 'medium')}
                  </span>
                  <span className="safety-alert-type-icon">
                    {getTypeIcon(alert.type || 'other')}
                  </span>
                  <h4 className="safety-alert-title">
                    {alert.title || t('safetyAlerts.list.untitledAlert')}
                  </h4>
                  <span
                    className="safety-alert-severity-badge"
                    style={{ backgroundColor: getSeverityColor(alert.severity || 'medium') }}
                  >
                    {(alert.severity || 'medium').toUpperCase()}
                  </span>
                </div>

                <div className="safety-alert-meta">
                  <span className="safety-alert-author">
                    {t('safetyAlerts.list.byAuthor', {
                      author: alert.createdBy?.username || t('safetyAlerts.list.unknownAuthor'),
                    })}
                  </span>
                  <span className="safety-alert-date">
                    {formatDate(alert.startDate || new Date())}
                  </span>
                </div>
              </div>

              <p className="safety-alert-description">
                {alert.description || t('safetyAlerts.list.noDescription')}
              </p>

              <div className="safety-alert-footer">
                <div className="safety-alert-details">
                  <span className="safety-alert-type">{alert.type || 'other'}</span>
                  {alert.endDate && (
                    <span className="safety-alert-end-date">
                      {t('safetyAlerts.list.until', { date: formatDate(alert.endDate) })}
                    </span>
                  )}
                  {alert.requiresAcknowledgement === true && !userAcknowledged && (
                    <span className="safety-alert-acknowledgment">
                      {t('safetyAlerts.list.requiresAcknowledgment')}
                    </span>
                  )}
                </div>

                <div className="safety-alert-actions">
                  {canAcknowledge && (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert._id)}
                      className="safety-alert-acknowledge-button"
                      aria-label={t('safetyAlerts.list.acknowledge')}
                    >
                      {t('safetyAlerts.list.acknowledge')}
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteClick(alert._id)}
                      className="safety-alert-delete-button"
                      aria-label={t('safetyAlerts.list.delete')}
                    >
                      {t('safetyAlerts.list.delete')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('safetyAlerts.list.deleteConfirmTitle')}
        message={t('safetyAlerts.list.deleteConfirmMessage', {
          title: deleteDialog.alert?.title || t('safetyAlerts.list.untitledAlert'),
        })}
        confirmLabel={t('safetyAlerts.list.delete')}
        cancelLabel={t('safetyAlerts.cancel')}
      />
    </div>
  );
};

SafetyAlertList.propTypes = {
  entityId: PropTypes.string.isRequired,
  entityType: PropTypes.oneOf(['campground', 'campsite']),
  initialAlerts: PropTypes.array,
  onAlertDeleted: PropTypes.func,
  onAlertAcknowledged: PropTypes.func,
  showActiveOnly: PropTypes.bool,
  showAllForAcknowledgment: PropTypes.bool,
};

export default SafetyAlertList;
