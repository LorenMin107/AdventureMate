import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import '../TripExportDialog.css';
import './SuspensionDialog.css';

const SuspensionDialog = ({
  open,
  onClose,
  onConfirm,
  action, // 'suspend' or 'reactivate'
  username,
}) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('');
  const [errors, setErrors] = useState({});

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate reason
    if (action === 'suspend' && !reason.trim()) {
      newErrors.reason = t('suspensionDialog.reasonRequired');
    }

    // Validate duration if provided
    if (action === 'suspend' && duration && (isNaN(duration) || parseInt(duration) < 1)) {
      newErrors.duration = t('suspensionDialog.invalidDuration');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear errors and submit
    setErrors({});
    onConfirm({
      reason: reason.trim(),
      duration: duration ? parseInt(duration) : null,
    });
  };

  const handleClose = () => {
    setReason('');
    setDuration('');
    setErrors({});
    onClose();
  };

  const getTitle = () => {
    return action === 'suspend'
      ? t('suspensionDialog.suspendTitle', { username })
      : t('suspensionDialog.reactivateTitle', { username });
  };

  const getMessage = () => {
    return action === 'suspend'
      ? t('suspensionDialog.suspendMessage', { username })
      : t('suspensionDialog.reactivateMessage', { username });
  };

  const getConfirmLabel = () => {
    return action === 'suspend'
      ? t('suspensionDialog.suspendButton')
      : t('suspensionDialog.reactivateButton');
  };

  return createPortal(
    <div className="export-dialog-overlay">
      <div
        className="export-dialog suspension-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="suspension-dialog-title"
      >
        <div className="export-dialog-header">
          <div className="header-content">
            <h2 id="suspension-dialog-title">{getTitle()}</h2>
          </div>
          <button
            className="close-button"
            onClick={handleClose}
            aria-label={t('suspensionDialog.closeDialog')}
          >
            &times;
          </button>
        </div>
        <div className="export-dialog-content">
          <form onSubmit={handleSubmit} className="suspension-form">
            <div className="suspension-message">{getMessage()}</div>

            {action === 'suspend' && (
              <>
                <div className="form-group">
                  <label htmlFor="suspension-reason" className="form-label">
                    {t('suspensionDialog.reasonLabel')} *
                  </label>
                  <textarea
                    id="suspension-reason"
                    className={`form-input ${errors.reason ? 'error' : ''}`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t('suspensionDialog.reasonPlaceholder')}
                    rows="3"
                    required
                  />
                  {errors.reason && <div className="error-message">{errors.reason}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="suspension-duration" className="form-label">
                    {t('suspensionDialog.durationLabel')}
                  </label>
                  <div className="duration-input-group">
                    <input
                      id="suspension-duration"
                      type="number"
                      className={`form-input ${errors.duration ? 'error' : ''}`}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder={t('suspensionDialog.durationPlaceholder')}
                      min="1"
                    />
                    <span className="duration-unit">{t('suspensionDialog.days')}</span>
                  </div>
                  <div className="duration-help">{t('suspensionDialog.durationHelp')}</div>
                  {errors.duration && <div className="error-message">{errors.duration}</div>}
                </div>
              </>
            )}

            {action === 'reactivate' && (
              <div className="form-group">
                <label htmlFor="reactivation-reason" className="form-label">
                  {t('suspensionDialog.reactivationReasonLabel')}
                </label>
                <textarea
                  id="reactivation-reason"
                  className="form-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('suspensionDialog.reactivationReasonPlaceholder')}
                  rows="3"
                />
              </div>
            )}

            <div className="dialog-actions">
              <button type="button" className="dialog-button cancel-button" onClick={handleClose}>
                {t('suspensionDialog.cancelButton')}
              </button>
              <button
                type="submit"
                className={`dialog-button confirm-button ${
                  action === 'suspend' ? 'suspend' : 'reactivate'
                }`}
              >
                {getConfirmLabel()}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SuspensionDialog;
