import React from 'react';
import { createPortal } from 'react-dom';
import '../TripExportDialog.css';

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
}) => {
  if (!open) return null;
  return createPortal(
    <div className="export-dialog-overlay">
      <div
        className="export-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="export-dialog-header">
          <div className="header-content">
            <h2 id="confirm-dialog-title">{title}</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close dialog">
            &times;
          </button>
        </div>
        <div className="export-dialog-content">
          <div style={{ padding: '1.5rem 1.75rem', textAlign: 'center' }}>
            <p style={{ marginBottom: '2rem' }}>{message}</p>
            <button
              className="export-button"
              style={{ background: 'var(--color-error)', marginRight: 12 }}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
            <button
              className="export-button"
              style={{
                background: 'var(--color-border)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
              onClick={onClose}
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;
