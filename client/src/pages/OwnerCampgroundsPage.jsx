import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFlashMessage } from '../context/FlashMessageContext';
import { useTheme } from '../context/ThemeContext';
import useOwners from '../hooks/useOwners';
import { logError } from '../utils/logger';
import './OwnerCampgroundsPage.css';

/**
 * Owner Campgrounds Page
 * Modern dashboard for campground owners to manage their listings
 */
const OwnerCampgroundsPage = () => {
  const { showMessage } = useFlashMessage();
  const { theme } = useTheme();
  const { useOwnerCampgrounds, useDeleteCampground } = useOwners();

  const [campgrounds, setCampgrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [sort, setSort] = useState({
    field: 'title',
    order: 'asc',
  });

  // Initialize the delete mutation
  const deleteCampgroundMutation = useDeleteCampground();

  // Fetch owner's campgrounds
  const {
    data: campgroundsData,
    isLoading,
    error: fetchError,
    refetch,
  } = useOwnerCampgrounds({
    page: pagination.page,
    limit: pagination.limit,
    sortField: sort.field,
    sortOrder: sort.order,
  });

  useEffect(() => {
    if (campgroundsData) {
      setCampgrounds(campgroundsData.campgrounds || []);
      setPagination(campgroundsData.pagination || pagination);
      setLoading(false);
      setError(null);
    }
  }, [campgroundsData]);

  useEffect(() => {
    if (fetchError) {
      setError('Failed to load campgrounds. Please try again later.');
      setLoading(false);
    }
  }, [fetchError]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination({ ...pagination, page: newPage });
  };

  const handleSortChange = (field) => {
    const newOrder = field === sort.field && sort.order === 'asc' ? 'desc' : 'asc';
    setSort({ field, order: newOrder });
  };

  const handleDelete = async (id, title) => {
    if (
      !window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)
    ) {
      return;
    }

    try {
      await deleteCampgroundMutation.mutateAsync(id);
      showMessage('Campground deleted successfully', 'success');
      setCampgrounds(campgrounds.filter((campground) => campground._id !== id));
      refetch();
    } catch (err) {
      logError('Error deleting campground', err);
      showMessage('Failed to delete campground. Please try again later.', 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (isActive) => {
    return isActive ? '🟢' : '🔴';
  };

  if (loading) {
    return (
      <div className="owner-loading">
        <div className="owner-loading-spinner"></div>
        <p>Loading your campgrounds...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-error">
        <h4>Error Loading Campgrounds</h4>
        <p>{error}</p>
        <button onClick={() => refetch()} className="owner-btn owner-btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`owner-campgrounds ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Enhanced Page Header */}
      <div className="owner-page-header">
        <div className="header-content">
          <div className="header-main">
            <div className="greeting-section">
              <h1>My Campgrounds</h1>
              <p className="header-subtitle">
                Manage your campground listings and track their performance
              </p>
            </div>
            <div className="header-stats">
              <div className="header-stat">
                <span className="stat-label">Total Campgrounds</span>
                <span className="stat-value">{pagination.total}</span>
              </div>
              <div className="header-stat">
                <span className="stat-label">Active Listings</span>
                <span className="stat-value">{campgrounds.filter((c) => c.isActive).length}</span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <Link to="/owner/campgrounds/new" className="owner-btn owner-btn-primary">
              <span className="btn-icon">➕</span>
              Add New Campground
            </Link>
            <div className="view-controls">
              <select
                value={pagination.limit}
                onChange={(e) =>
                  setPagination({ ...pagination, page: 1, limit: Number(e.target.value) })
                }
                className="owner-select"
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="campgrounds-content">
        {campgrounds.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏕️</div>
            <h3>No Campgrounds Yet</h3>
            <p>
              Start by adding your first campground to begin accepting bookings and growing your
              business.
            </p>
            <div className="empty-actions">
              <Link to="/owner/campgrounds/new" className="owner-btn owner-btn-primary">
                Add Your First Campground
              </Link>
              <Link to="/owner/dashboard" className="owner-btn owner-btn-outline">
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Enhanced Campgrounds Table */}
            <div className="owner-card table-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>Campground Listings</h3>
                  <span className="card-subtitle">
                    Showing {campgrounds.length} of {pagination.total} campgrounds
                  </span>
                </div>
                <div className="table-actions">
                  <span className="sort-info">
                    Sorted by: <strong>{sort.field}</strong> ({sort.order})
                  </span>
                </div>
              </div>

              <div className="table-container">
                <table className="owner-table">
                  <thead>
                    <tr>
                      <th
                        className={`sortable ${sort.field === 'title' ? `sorted-${sort.order}` : ''}`}
                        onClick={() => handleSortChange('title')}
                      >
                        <div className="th-content">
                          <span>Campground</span>
                          <span className="sort-indicator">
                            {sort.field === 'title' ? (sort.order === 'asc' ? '↑' : '↓') : '↕'}
                          </span>
                        </div>
                      </th>
                      <th
                        className={`sortable ${sort.field === 'location' ? `sorted-${sort.order}` : ''}`}
                        onClick={() => handleSortChange('location')}
                      >
                        <div className="th-content">
                          <span>Location</span>
                          <span className="sort-indicator">
                            {sort.field === 'location' ? (sort.order === 'asc' ? '↑' : '↓') : '↕'}
                          </span>
                        </div>
                      </th>
                      <th className="text-center">Campsites</th>
                      <th className="text-center">Reviews</th>
                      <th className="text-center">Bookings</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Created</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campgrounds.map((campground) => (
                      <tr key={campground._id} className="campground-row">
                        <td className="campground-info">
                          <div className="campground-title">
                            <div className="title-main">
                              <strong>{campground.title}</strong>
                              {campground.images && campground.images.length > 0 && (
                                <span className="image-count">📷 {campground.images.length}</span>
                              )}
                            </div>
                            {campground.description && (
                              <div className="campground-description">
                                {campground.description.substring(0, 60)}...
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="location-cell">
                          <div className="location-info">
                            <span className="location-text">{campground.location}</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="metric-cell">
                            <span className="count-badge">{campground.campsites?.length || 0}</span>
                            <span className="metric-label">sites</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="metric-cell">
                            <div className="reviews-info">
                              <span className="count-badge">{campground.reviews?.length || 0}</span>
                              {campground.averageRating && (
                                <span className="rating">
                                  ⭐ {campground.averageRating.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="metric-cell">
                            <span className="count-badge">{campground.bookings?.length || 0}</span>
                            <span className="metric-label">bookings</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="status-cell">
                            <span
                              className={`status-badge ${campground.isActive ? 'status-active' : 'status-inactive'}`}
                            >
                              <span className="status-icon">
                                {getStatusIcon(campground.isActive)}
                              </span>
                              {campground.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="date-cell">
                            <span className="date-text">{formatDate(campground.createdAt)}</span>
                          </div>
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <Link
                              to={`/campgrounds/${campground._id}`}
                              className="owner-btn owner-btn-secondary owner-btn-sm"
                              target="_blank"
                              title="View public page"
                            >
                              👁️
                            </Link>
                            <Link
                              to={`/owner/campgrounds/${campground._id}`}
                              className="owner-btn owner-btn-outline owner-btn-sm"
                              title="Manage campground"
                            >
                              ⚙️
                            </Link>
                            <Link
                              to={`/owner/campgrounds/${campground._id}/edit`}
                              className="owner-btn owner-btn-primary owner-btn-sm"
                              title="Edit campground"
                            >
                              ✏️
                            </Link>
                            <button
                              onClick={() => handleDelete(campground._id, campground.title)}
                              className="owner-btn owner-btn-danger owner-btn-sm"
                              title="Delete campground"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Enhanced Pagination */}
            {pagination.totalPages > 1 && (
              <div className="owner-pagination">
                <div className="pagination-controls">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    className="owner-btn owner-btn-outline"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="owner-btn owner-btn-outline"
                  >
                    Previous
                  </button>
                </div>

                <div className="pagination-info">
                  <span className="page-info">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <span className="total-info">({pagination.total} total campgrounds)</span>
                </div>

                <div className="pagination-controls">
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="owner-btn owner-btn-outline"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="owner-btn owner-btn-outline"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OwnerCampgroundsPage;
