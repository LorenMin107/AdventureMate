import { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import apiClient from '../utils/api';
import { logError } from '../utils/logger';
import StandaloneDateRangePicker from './forms/StandaloneDateRangePicker';
import './SafetyAlertForm.css';

/**
 * SafetyAlertForm component for creating and editing safety alerts
 *
 * @param {Object} props - Component props
 * @param {string} props.entityId - ID of the campground or campsite
 * @param {string} props.entityType - Type of entity ('campground' or 'campsite')
 * @param {Object} props.alert - Existing alert data for editing (optional)
 * @param {boolean} props.isEditing - Whether the form is for editing (true) or creating (false)
 * @param {function} props.onAlertSubmitted - Callback function when an alert is successfully submitted
 * @param {function} props.onCancel - Callback function when the form is cancelled
 * @returns {JSX.Element} Safety alert form component
 */
const SafetyAlertForm = ({
  entityId,
  entityType = 'campground',
  alert = null,
  isEditing = false,
  onAlertSubmitted,
  onCancel,
}) => {
  const [formData, setFormData] = useState(() => {
    const now = new Date();
    // Set default start date to current time for immediate activation
    const defaultStartDate = now; // Current time
    const defaultEndDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours later

    return {
      title: alert?.title || '',
      description: alert?.description || '',
      severity: alert?.severity || 'medium',
      type: alert?.type || '',
      startDate: alert?.startDate
        ? new Date(alert.startDate).toISOString().slice(0, 16)
        : defaultStartDate.toISOString().slice(0, 16),
      endDate: alert?.endDate
        ? new Date(alert.endDate).toISOString().slice(0, 16)
        : defaultEndDate.toISOString().slice(0, 16),
      isPublic: alert?.isPublic !== undefined ? alert.isPublic : true,
      requiresAcknowledgement: alert?.requiresAcknowledgement || false,
    };
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const severityOptions = [
    { value: 'low', label: t('safetyAlerts.severityOptions.low'), color: '#059669' },
    { value: 'medium', label: t('safetyAlerts.severityOptions.medium'), color: '#d97706' },
    { value: 'high', label: t('safetyAlerts.severityOptions.high'), color: '#ea580c' },
    { value: 'critical', label: t('safetyAlerts.severityOptions.critical'), color: '#dc2626' },
  ];

  const typeOptions = [
    { value: 'weather', label: t('safetyAlerts.typeOptions.weather'), icon: '🌦️' },
    { value: 'wildlife', label: t('safetyAlerts.typeOptions.wildlife'), icon: '🐻' },
    { value: 'fire', label: t('safetyAlerts.typeOptions.fire'), icon: '🔥' },
    { value: 'flood', label: t('safetyAlerts.typeOptions.flood'), icon: '🌊' },
    { value: 'medical', label: t('safetyAlerts.typeOptions.medical'), icon: '🏥' },
    { value: 'security', label: t('safetyAlerts.typeOptions.security'), icon: '🔒' },
    { value: 'maintenance', label: t('safetyAlerts.typeOptions.maintenance'), icon: '🔧' },
    { value: 'other', label: t('safetyAlerts.typeOptions.other'), icon: '📢' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleStartDateChange = (date) => {
    if (date) {
      const startDate = new Date(date);

      setFormData((prev) => {
        const newData = {
          ...prev,
          startDate: startDate.toISOString().slice(0, 16),
        };

        // Only auto-set end date if it's not already set or if the new start date is after the current end date
        const currentEndDate = prev.endDate ? new Date(prev.endDate) : null;
        if (!currentEndDate || startDate >= currentEndDate) {
          const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours later
          newData.endDate = endDate.toISOString().slice(0, 16);
        }

        return newData;
      });
    }
  };

  const handleEndDateChange = (date) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        endDate: new Date(date).toISOString().slice(0, 16),
      }));
    }
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.title.trim()) {
      errors.push(t('safetyAlerts.titleRequired'));
    }

    if (!formData.description.trim()) {
      errors.push(t('safetyAlerts.descriptionRequired'));
    }

    if (!formData.type || formData.type === '') {
      errors.push(t('safetyAlerts.typeRequired'));
    }

    if (!formData.startDate || formData.startDate.trim() === '') {
      errors.push(t('safetyAlerts.startDateRequired'));
    }

    if (!formData.endDate || formData.endDate.trim() === '') {
      errors.push(t('safetyAlerts.endDateRequired'));
    } else if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.push(t('safetyAlerts.endDateAfterStart'));
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError(t('safetyAlerts.loginRequired'));
      return;
    }

    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      };

      const entityPath = entityType === 'campsite' ? 'campsite-safety-alerts' : 'campgrounds';
      let response;
      if (isEditing) {
        response = await apiClient.put(
          `/${entityPath}/${entityId}/safety-alerts/${alert._id}`,
          payload
        );
      } else {
        response = await apiClient.post(`/${entityPath}/${entityId}/safety-alerts`, payload);
      }

      const data = response.data;

      // Reset form if creating new alert
      if (!isEditing) {
        const now = new Date();
        const defaultStartDate = now; // Current time
        const defaultEndDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours later

        setFormData({
          title: '',
          description: '',
          severity: 'medium',
          type: '',
          startDate: defaultStartDate.toISOString().slice(0, 16),
          endDate: defaultEndDate.toISOString().slice(0, 16),
          isPublic: true,
          requiresAcknowledgement: false,
        });
      }

      // Notify parent component
      if (onAlertSubmitted) {
        onAlertSubmitted(data.alert);
      }
    } catch (err) {
      logError('Error submitting safety alert', err);
      setError(err.response?.data?.message || t('safetyAlerts.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return <div className="safety-alert-form-login-message">{t('safetyAlerts.loginRequired')}</div>;
  }

  return (
    <div className="safety-alert-form">
      <h3 className="safety-alert-form-title">
        {isEditing ? t('safetyAlerts.editAlert') : t('safetyAlerts.createAlert')}
      </h3>

      {error && <div className="safety-alert-form-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="safety-alert-form-group">
          <label htmlFor="title">{t('safetyAlerts.alertTitle')}</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={t('safetyAlerts.enterTitle')}
            maxLength={100}
            required
            disabled={submitting}
          />
        </div>

        <div className="safety-alert-form-group">
          <label htmlFor="description">{t('safetyAlerts.description')}</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={t('safetyAlerts.describeConcern')}
            rows={4}
            maxLength={1000}
            required
            disabled={submitting}
          />
        </div>

        <div className="safety-alert-form-row">
          <div className="safety-alert-form-group">
            <label htmlFor="severity">{t('safetyAlerts.severity')}</label>
            <select
              id="severity"
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              disabled={submitting}
            >
              {severityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="safety-alert-form-group">
            <label htmlFor="type">{t('safetyAlerts.type')}</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              disabled={submitting}
            >
              <option value="">{t('safetyAlerts.selectType')}</option>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="safety-alert-form-group">
          <StandaloneDateRangePicker
            startDate={formData.startDate ? new Date(formData.startDate) : null}
            endDate={formData.endDate ? new Date(formData.endDate) : null}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            label={t('safetyAlerts.alertDuration')}
            minDate={new Date()}
            maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // Allow up to 1 year from now
            required={true}
            error={
              error && (error.includes('End date') || error.includes('Start date')) ? error : ''
            }
          />
          <small className="safety-alert-form-help-text">{t('safetyAlerts.durationHelp')}</small>
        </div>

        <div className="safety-alert-form-checkboxes">
          <div className="safety-alert-form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
                disabled={submitting}
              />
              {t('safetyAlerts.publicAlert')}
            </label>
          </div>

          <div className="safety-alert-form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="requiresAcknowledgement"
                checked={formData.requiresAcknowledgement}
                onChange={handleChange}
                disabled={submitting}
              />
              {t('safetyAlerts.requireAcknowledgment')}
            </label>
          </div>
        </div>

        <div className="safety-alert-form-actions">
          <button type="submit" className="safety-alert-form-submit" disabled={submitting}>
            {submitting
              ? isEditing
                ? t('safetyAlerts.updating')
                : t('safetyAlerts.creating')
              : isEditing
                ? t('safetyAlerts.updateAlertButton')
                : t('safetyAlerts.createAlertButton')}
          </button>

          {onCancel && (
            <button
              type="button"
              className="safety-alert-form-cancel"
              onClick={onCancel}
              disabled={submitting}
            >
              {t('safetyAlerts.cancel')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

SafetyAlertForm.propTypes = {
  entityId: PropTypes.string.isRequired,
  entityType: PropTypes.oneOf(['campground', 'campsite']),
  alert: PropTypes.object,
  isEditing: PropTypes.bool,
  onAlertSubmitted: PropTypes.func,
  onCancel: PropTypes.func,
};

export default SafetyAlertForm;
