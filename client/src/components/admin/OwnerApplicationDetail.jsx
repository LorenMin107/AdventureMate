import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import { useTranslation } from 'react-i18next';
import './OwnerApplicationDetail.css';

/**
 * OwnerApplicationDetail component for viewing and managing individual owner applications
 *
 * @returns {JSX.Element} Owner application detail component
 */
const OwnerApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionData, setActionData] = useState({ notes: '', reason: '' });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ status: '', notes: '' });

  const api = useApi();
  const { t } = useTranslation();

  // Fetch application details
  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await api.fetchData(`/admin/owner-applications/${id}`);

      if (response.status === 'success') {
        setApplication(response.data.application);
      } else {
        setError(t('ownerApplicationDetail.fetchError'));
      }
    } catch (err) {
      setError(t('ownerApplicationDetail.fetchError'));
      console.error('Error fetching application:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  // Handle application action (approve/reject)
  const handleApplicationAction = async () => {
    try {
      let response;
      const endpoint =
        actionType === 'approve'
          ? `/admin/owner-applications/${id}/approve`
          : `/admin/owner-applications/${id}/reject`;

      const data =
        actionType === 'approve'
          ? { notes: actionData.notes }
          : { reason: actionData.reason, notes: actionData.notes };

      response = await api.postData(endpoint, data);

      if (response.status === 'success') {
        // Refresh the application data
        await fetchApplication();
        setShowActionModal(false);
        setActionData({ notes: '', reason: '' });
      } else {
        setError(response.message || t('ownerApplicationDetail.actionFailed'));
      }
    } catch (err) {
      setError(t('ownerApplicationDetail.processError'));
      console.error('Error processing application:', err);
    }
  };

  // Handle review update
  const handleReviewUpdate = async () => {
    try {
      const response = await api.postData(`/admin/owner-applications/${id}/review`, {
        status: reviewData.status,
        notes: reviewData.notes,
      });

      if (response.status === 'success') {
        await fetchApplication();
        setShowReviewModal(false);
        setReviewData({ status: '', notes: '' });
      } else {
        setError(response.message || t('ownerApplicationDetail.updateReviewError'));
      }
    } catch (err) {
      setError(t('ownerApplicationDetail.updateReviewError'));
      console.error('Error updating review:', err);
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      under_review: 'status-reviewing',
      approved: 'status-approved',
      rejected: 'status-rejected',
    };
    return statusClasses[status] || 'status-pending';
  };

  // Get status display text
  const getStatusDisplay = (status) => {
    const statusMap = {
      pending: 'Pending Review',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="application-detail-container">
        <div className="loading-spinner">Loading application details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="application-detail-container">
        <div className="error-message">
          {error}
          <button onClick={() => navigate('/admin/owner-applications')} className="error-back">
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="application-detail-container">
        <div className="not-found">
          <h2>Application Not Found</h2>
          <p>The requested application could not be found.</p>
          <Link to="/admin/owner-applications" className="back-button">
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="application-detail-container">
      <div className="application-detail-header">
        <div className="header-content">
          <h1>Owner Application Details</h1>
          <p>Review and manage this owner application</p>
        </div>
        <Link to="/admin/owner-applications" className="back-button">
          ← Back to Applications
        </Link>
      </div>

      {/* Application Status */}
      <div className="status-section">
        <div className="status-info">
          <span className={`status-badge ${getStatusBadgeClass(application.status)}`}>
            {getStatusDisplay(application.status)}
          </span>
          <span className="application-id">ID: {application._id}</span>
        </div>
        <div className="application-date">
          Applied: {new Date(application.createdAt).toLocaleDateString()}
          {application.reviewedAt && (
            <span className="reviewed-date">
              Reviewed: {new Date(application.reviewedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Applicant Information */}
      <div className="detail-section">
        <h2>Applicant Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <label>Username:</label>
            <span>{application.user?.username}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{application.user?.email}</span>
          </div>
          <div className="info-item">
            <label>Phone:</label>
            <span>{application.user?.phone}</span>
          </div>
          <div className="info-item">
            <label>Joined:</label>
            <span>{new Date(application.user?.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div className="detail-section">
        <h2>Business Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <label>Business Name:</label>
            <span>{application.businessName}</span>
          </div>
          <div className="info-item">
            <label>Business Type:</label>
            <span>{application.businessType}</span>
          </div>
          <div className="info-item">
            <label>Registration Number:</label>
            <span>{application.businessRegistrationNumber || 'Not provided'}</span>
          </div>
          <div className="info-item">
            <label>Tax ID:</label>
            <span>{application.taxId || 'Not provided'}</span>
          </div>
          <div className="info-item">
            <label>Business Phone:</label>
            <span>{application.businessPhone}</span>
          </div>
          <div className="info-item">
            <label>Business Email:</label>
            <span>{application.businessEmail}</span>
          </div>
        </div>
      </div>

      {/* Business Address */}
      <div className="detail-section">
        <h2>Business Address</h2>
        <div className="address-info">
          <p>{application.businessAddress?.street}</p>
          <p>
            {application.businessAddress?.city}, {application.businessAddress?.state}{' '}
            {application.businessAddress?.zipCode}
          </p>
          <p>{application.businessAddress?.country}</p>
        </div>
      </div>

      {/* Application Details */}
      <div className="detail-section">
        <h2>Application Details</h2>
        <div className="info-grid">
          <div className="info-item full-width">
            <label>Application Reason:</label>
            <span>{application.applicationReason}</span>
          </div>
          {application.experience && (
            <div className="info-item full-width">
              <label>Experience:</label>
              <span>{application.experience}</span>
            </div>
          )}
          {application.expectedProperties && (
            <div className="info-item">
              <label>Expected Properties:</label>
              <span>{application.expectedProperties}</span>
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      {application.documents && application.documents.length > 0 && (
        <div className="detail-section">
          <h2>Documents</h2>
          <div className="documents-list">
            {application.documents.map((doc, index) => (
              <div key={index} className="document-item">
                <span className="document-type">{doc.type}</span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="document-link"
                >
                  {doc.filename}
                </a>
                <span className="document-date">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Notes */}
      {application.reviewNotes && application.reviewNotes.length > 0 && (
        <div className="detail-section">
          <h2>Review Notes</h2>
          <div className="review-notes">
            {application.reviewNotes.map((note, index) => (
              <div key={index} className="review-note">
                <div className="note-header">
                  <span className="note-author">{note.addedBy?.username}</span>
                  <span className="note-date">{new Date(note.addedAt).toLocaleDateString()}</span>
                  <span className={`note-type ${note.type}`}>{note.type}</span>
                </div>
                <p className="note-content">{note.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejection Reason */}
      {application.rejectionReason && (
        <div className="detail-section">
          <h2>Rejection Reason</h2>
          <div className="rejection-reason">
            <p>{application.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="application-actions">
        {application.status === 'pending' && (
          <>
            <button
              onClick={() => {
                setActionType('approve');
                setShowActionModal(true);
              }}
              className="action-button approve-button"
            >
              Approve Application
            </button>
            <button
              onClick={() => {
                setActionType('reject');
                setShowActionModal(true);
              }}
              className="action-button reject-button"
            >
              Reject Application
            </button>
            <button
              onClick={() => setShowReviewModal(true)}
              className="action-button review-button"
            >
              Update Review Status
            </button>
          </>
        )}

        {application.status === 'under_review' && (
          <>
            <button
              onClick={() => {
                setActionType('approve');
                setShowActionModal(true);
              }}
              className="action-button approve-button"
            >
              Approve Application
            </button>
            <button
              onClick={() => {
                setActionType('reject');
                setShowActionModal(true);
              }}
              className="action-button reject-button"
            >
              Reject Application
            </button>
            <button
              onClick={() => setShowReviewModal(true)}
              className="action-button review-button"
            >
              Update Review Status
            </button>
          </>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{actionType === 'approve' ? 'Approve Application' : 'Reject Application'}</h3>

            {actionType === 'reject' && (
              <div className="form-group">
                <label htmlFor="reason">Rejection Reason *</label>
                <textarea
                  id="reason"
                  value={actionData.reason}
                  onChange={(e) => setActionData((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Please provide a reason for rejection"
                  required
                  className="form-textarea"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <textarea
                id="notes"
                value={actionData.notes}
                onChange={(e) => setActionData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                className="form-textarea"
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setActionData({ notes: '', reason: '' });
                }}
                className="modal-button cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={handleApplicationAction}
                disabled={actionType === 'reject' && !actionData.reason.trim()}
                className={`modal-button ${actionType === 'approve' ? 'approve-button' : 'reject-button'}`}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Update Review Status</h3>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={reviewData.status}
                onChange={(e) => setReviewData((prev) => ({ ...prev, status: e.target.value }))}
                className="form-select"
              >
                <option value="">Select Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reviewNotes">Notes (Optional)</label>
              <textarea
                id="reviewNotes"
                value={reviewData.notes}
                onChange={(e) => setReviewData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Review notes..."
                className="form-textarea"
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewData({ status: '', notes: '' });
                }}
                className="modal-button cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewUpdate}
                disabled={!reviewData.status}
                className="modal-button review-button"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerApplicationDetail;
