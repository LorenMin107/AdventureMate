import { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
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

  const severityOptions = [
    { value: 'low', label: 'Low', color: '#059669' },
    { value: 'medium', label: 'Medium', color: '#d97706' },
    { value: 'high', label: 'High', color: '#ea580c' },
    { value: 'critical', label: 'Critical', color: '#dc2626' },
  ];

  const typeOptions = [
    { value: 'weather', label: 'Weather', icon: '🌦️' },
    { value: 'wildlife', label: 'Wildlife', icon: '🐻' },
    { value: 'fire', label: 'Fire', icon: '🔥' },
    { value: 'flood', label: 'Flood', icon: '🌊' },
    { value: 'medical', label: 'Medical', icon: '🏥' },
    { value: 'security', label: 'Security', icon: '🔒' },
    { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { value: 'other', label: 'Other', icon: '📢' },
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
      errors.push('Title is required');
    }

    if (!formData.description.trim()) {
      errors.push('Description is required');
    }

    if (!formData.type || formData.type === '') {
      errors.push('Alert type is required');
    }

    if (!formData.startDate || formData.startDate.trim() === '') {
      errors.push('Start date is required');
    }

    if (!formData.endDate || formData.endDate.trim() === '') {
      errors.push('End date is required');
    } else if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.push('End date must be after start date');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError('You must be logged in to create safety alerts');
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
      setError(
        err.response?.data?.message || 'Failed to submit safety alert. Please try again later.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="safety-alert-form-login-message">
        Please <a href="/login">log in</a> to create safety alerts.
      </div>
    );
  }

  return (
    <div className="safety-alert-form">
      <h3 className="safety-alert-form-title">
        {isEditing ? 'Edit Safety Alert' : 'Create Safety Alert'}
      </h3>

      {error && <div className="safety-alert-form-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="safety-alert-form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter alert title..."
            maxLength={100}
            required
            disabled={submitting}
          />
        </div>

        <div className="safety-alert-form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the safety concern..."
            rows={4}
            maxLength={1000}
            required
            disabled={submitting}
          />
        </div>

        <div className="safety-alert-form-row">
          <div className="safety-alert-form-group">
            <label htmlFor="severity">Severity</label>
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
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              disabled={submitting}
            >
              <option value="">Select alert type...</option>
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
            label="Alert Duration"
            minDate={new Date()}
            maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // Allow up to 1 year from now
            required={true}
            error={
              error && (error.includes('End date') || error.includes('Start date')) ? error : ''
            }
          />
          <small className="safety-alert-form-help-text">
            Select the start and end dates for this safety alert. You can choose any duration up to
            one year.
          </small>
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
              Public Alert (visible to all users)
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
              Require User Acknowledgment
            </label>
          </div>
        </div>

        <div className="safety-alert-form-actions">
          <button type="submit" className="safety-alert-form-submit" disabled={submitting}>
            {submitting
              ? isEditing
                ? 'Updating...'
                : 'Creating...'
              : isEditing
                ? 'Update Alert'
                : 'Create Alert'}
          </button>

          {onCancel && (
            <button
              type="button"
              className="safety-alert-form-cancel"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
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
