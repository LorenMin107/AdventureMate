import React from 'react';
import PropTypes from 'prop-types';
import './FormStyles.css';
import { useTranslation } from 'react-i18next';

/**
 * Reusable error message component for displaying form errors
 *
 * @param {Object} props - Component props
 * @param {string} props.message - Error message to display
 * @param {string} props.type - Type of error (error, warning, info)
 * @param {boolean} props.dismissible - Whether the error can be dismissed
 * @param {Function} props.onDismiss - Function to call when the error is dismissed
 * @param {string} props.className - Additional CSS class names
 * @returns {JSX.Element} ErrorMessage component
 */
const ErrorMessage = ({
  message,
  type = 'error',
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  const { t } = useTranslation();
  if (!message) return null;

  return (
    <div className={`form-message form-message-${type} ${className}`}>
      <div className="form-message-content">
        {type === 'error' && <span className="form-message-icon">⚠️</span>}
        {type === 'warning' && <span className="form-message-icon">⚠️</span>}
        {type === 'info' && <span className="form-message-icon">ℹ️</span>}
        {type === 'success' && <span className="form-message-icon">✅</span>}
        <p className="form-message-text">{message}</p>
      </div>

      {dismissible && (
        <button
          type="button"
          className="form-message-dismiss"
          onClick={onDismiss}
          aria-label={t('errorMessage.dismissMessage')}
        >
          ×
        </button>
      )}
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.string,
  type: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
  dismissible: PropTypes.bool,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
};

export default ErrorMessage;
