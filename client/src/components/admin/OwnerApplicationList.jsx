import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import './OwnerApplicationList.css';

/**
 * OwnerApplicationList component for admin to manage owner applications
 *
 * @returns {JSX.Element} Owner application list component
 */
const OwnerApplicationList = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionData, setActionData] = useState({ notes: '', reason: '' });

  const api = useApi();

  // Fetch applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await api.fetchData(`/admin/owner-applications?${params}`);

      if (response.status === 'success') {
        setApplications(response.data.applications);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError('Failed to fetch applications');
      }
    } catch (err) {
      setError('Failed to fetch applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [currentPage, statusFilter]);

  // Handle application action (approve/reject)
  const handleApplicationAction = async () => {
    if (!selectedApplication) return;

    try {
      let response;
      const endpoint =
        actionType === 'approve'
          ? `/admin/owner-applications/${selectedApplication._id}/approve`
          : `/admin/owner-applications/${selectedApplication._id}/reject`;

      const data =
        actionType === 'approve'
          ? { notes: actionData.notes }
          : { reason: actionData.reason, notes: actionData.notes };

      response = await api.postData(endpoint, data);

      if (response.status === 'success') {
        // Refresh the applications list
        await fetchApplications();
        setShowActionModal(false);
        setSelectedApplication(null);
        setActionData({ notes: '', reason: '' });
      } else {
        setError(response.message || 'Action failed');
      }
    } catch (err) {
      setError('Failed to process application');
      console.error('Error processing application:', err);
    }
  };

  // Handle review update
  const handleReviewUpdate = async (applicationId, status, notes) => {
    try {
      const response = await api.postData(`/admin/owner-applications/${applicationId}/review`, {
        status,
        notes,
      });

      if (response.status === 'success') {
        await fetchApplications();
      } else {
        setError(response.message || 'Failed to update review');
      }
    } catch (err) {
      setError('Failed to update review');
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
      <div className="owner-applications-container">
        <div className="loading-spinner">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="owner-applications-container">
      <div className="owner-applications-header">
        <h1>Owner Applications</h1>
        <p>Manage campground owner applications</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="error-close">
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="applications-filters">
        <div className="filter-group">
          <label htmlFor="statusFilter">Status:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      <div className="applications-list">
        {applications.length === 0 ? (
          <div className="no-applications">
            <p>No applications found</p>
          </div>
        ) : (
          applications.map((application) => (
            <div key={application._id} className="application-card">
              <div className="application-header">
                <div className="application-info">
                  <h3>{application.businessName}</h3>
                  <p className="applicant-name">
                    Applicant: {application.user?.username} ({application.user?.email})
                  </p>
                  <p className="application-date">
                    Applied: {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="application-status">
                  <span className={`status-badge ${getStatusBadgeClass(application.status)}`}>
                    {getStatusDisplay(application.status)}
                  </span>
                </div>
              </div>

              <div className="application-details">
                <div className="detail-row">
                  <span className="detail-label">Business Type:</span>
                  <span className="detail-value">{application.businessType}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Business Phone:</span>
                  <span className="detail-value">{application.businessPhone}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Business Email:</span>
                  <span className="detail-value">{application.businessEmail}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">
                    {application.businessAddress?.street}, {application.businessAddress?.city},{' '}
                    {application.businessAddress?.state}
                  </span>
                </div>
              </div>

              <div className="application-actions">
                <Link
                  to={`/admin/owner-applications/${application._id}`}
                  className="action-button view-button"
                >
                  View Details
                </Link>

                {application.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedApplication(application);
                        setActionType('approve');
                        setShowActionModal(true);
                      }}
                      className="action-button approve-button"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedApplication(application);
                        setActionType('reject');
                        setShowActionModal(true);
                      }}
                      className="action-button reject-button"
                    >
                      Reject
                    </button>
                  </>
                )}

                {application.status === 'pending' && (
                  <button
                    onClick={() =>
                      handleReviewUpdate(
                        application._id,
                        'under_review',
                        'Application moved to review'
                      )
                    }
                    className="action-button review-button"
                  >
                    Move to Review
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedApplication && (
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
                  setSelectedApplication(null);
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
    </div>
  );
};

export default OwnerApplicationList;
