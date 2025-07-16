import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useApi from '../../hooks/useApi';
import './OwnerApplicationList.css';

/**
 * OwnerApplicationList component for admin to manage owner applications
 *
 * @returns {JSX.Element} Owner application list component
 */
const OwnerApplicationList = () => {
  const { t } = useTranslation();
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
      pending: t('adminOwnerApplication.pending'),
      under_review: t('adminOwnerApplication.reviewing'),
      approved: t('adminOwnerApplication.approved'),
      rejected: t('adminOwnerApplication.rejected'),
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="owner-applications-container">
        <div className="loading-spinner">{t('adminOwnerApplication.loadingApplications')}</div>
      </div>
    );
  }

  return (
    <div className="owner-applications-container">
      <div className="owner-applications-header">
        <h1>{t('adminOwnerApplication.title')}</h1>
        <p>{t('adminOwnerApplication.description')}</p>
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
          <label htmlFor="statusFilter">{t('adminOwnerApplication.filterByStatus')}:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">{t('adminOwnerApplication.allStatuses')}</option>
            <option value="pending">{t('adminOwnerApplication.pending')}</option>
            <option value="under_review">{t('adminOwnerApplication.reviewing')}</option>
            <option value="approved">{t('adminOwnerApplication.approved')}</option>
            <option value="rejected">{t('adminOwnerApplication.rejected')}</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      <div className="applications-list">
        {applications.length === 0 ? (
          <div className="no-applications">
            <p>{t('adminOwnerApplication.noApplications')}</p>
          </div>
        ) : (
          applications.map((application) => (
            <div key={application._id} className="application-card">
              <div className="application-header">
                <div className="application-info">
                  <h3>{application.businessName}</h3>
                  <p className="applicant-name">
                    {t('adminOwnerApplication.applicant')}: {application.user?.username} (
                    {application.user?.email})
                  </p>
                  <p className="application-date">
                    {t('adminOwnerApplication.appliedDate')}:{' '}
                    {new Date(application.createdAt).toLocaleDateString()}
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
                  <span className="detail-label">{t('adminOwnerApplication.email')}:</span>
                  <span className="detail-value">{application.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('adminOwnerApplication.phone')}:</span>
                  <span className="detail-value">{application.phone || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('adminOwnerApplication.businessType')}:</span>
                  <span className="detail-value">{application.businessType || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('adminOwnerApplication.experience')}:</span>
                  <span className="detail-value">{application.experience || 'N/A'}</span>
                </div>
              </div>

              <div className="application-actions">
                <Link
                  to={`/admin/owner-applications/${application._id}`}
                  className="owner-applications-container view-button"
                >
                  {t('adminOwnerApplication.viewDetails')}
                </Link>
                {application.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedApplication(application);
                        setActionType('approve');
                        setShowActionModal(true);
                      }}
                      className="approve-button"
                    >
                      {t('adminOwnerApplication.approve')}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedApplication(application);
                        setActionType('reject');
                        setShowActionModal(true);
                      }}
                      className="reject-button"
                    >
                      {t('adminOwnerApplication.reject')}
                    </button>
                  </>
                )}
                {application.status === 'pending' && (
                  <button
                    onClick={() => {
                      setSelectedApplication(application);
                      setActionType('review');
                      setShowActionModal(true);
                    }}
                    className="review-button"
                  >
                    {t('adminOwnerApplication.review')}
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
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            {t('adminOwnerApplication.previous')}
          </button>
          <span className="pagination-info">
            {t('adminOwnerApplication.pageInfo', { page: currentPage, totalPages })}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            {t('adminOwnerApplication.next')}
          </button>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {actionType === 'approve'
                ? t('adminOwnerApplication.confirmApproval')
                : actionType === 'reject'
                  ? t('adminOwnerApplication.confirmRejection')
                  : t('adminOwnerApplication.confirmReview')}
            </h3>
            <div className="form-group">
              <label htmlFor="notes">{t('adminOwnerApplication.notes')}:</label>
              <textarea
                id="notes"
                value={actionData.notes}
                onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
                className="form-textarea"
                rows="3"
              />
            </div>
            {actionType === 'reject' && (
              <div className="form-group">
                <label htmlFor="reason">{t('adminOwnerApplication.rejectionReason')}:</label>
                <textarea
                  id="reason"
                  value={actionData.reason}
                  onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                  className="form-textarea"
                  rows="3"
                  placeholder={t('adminOwnerApplication.enterRejectionReason')}
                />
              </div>
            )}
            <div className="modal-actions">
              <button
                onClick={() => setShowActionModal(false)}
                className="modal-button cancel-button"
              >
                {t('adminOwnerApplication.cancel')}
              </button>
              <button
                onClick={handleApplicationAction}
                className={`modal-button ${
                  actionType === 'approve'
                    ? 'approve-button'
                    : actionType === 'reject'
                      ? 'reject-button'
                      : 'review-button'
                }`}
              >
                {actionType === 'approve'
                  ? t('adminOwnerApplication.approve')
                  : actionType === 'reject'
                    ? t('adminOwnerApplication.reject')
                    : t('adminOwnerApplication.review')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerApplicationList;
