import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFlashMessage } from '../context/FlashMessageContext';
import useOwners from '../hooks/useOwners';
import { logError } from '../utils/logger';
import './OwnerCampgroundsPage.css';

/**
 * Owner Campgrounds Page
 * Allows campground owners to manage their campground listings
 */
const OwnerCampgroundsPage = () => {
  const { showMessage } = useFlashMessage();
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
      // Use the deleteCampgroundMutation initialized at the top level
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
    <div className="owner-campgrounds">
      {/* Page Header */}
      <div className="owner-page-header">
        <div className="header-content">
          <div>
            <h1>My Campgrounds</h1>
            <p>Manage your campground listings and campsites</p>
          </div>
          <div className="header-actions">
            <Link to="/owner/campgrounds/new" className="owner-btn owner-btn-primary">
              <span>➕</span>
              Add New Campground
            </Link>
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

      {campgrounds.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏕️</div>
          <h3>No Campgrounds Yet</h3>
          <p>Start by adding your first campground to begin accepting bookings.</p>
          <Link to="/owner/campgrounds/new" className="owner-btn owner-btn-primary">
            Add Your First Campground
          </Link>
        </div>
      ) : (
        <>
          {/* Campgrounds Table */}
          <div className="owner-card">
            <div className="table-container">
              <table className="owner-table">
                <thead>
                  <tr>
                    <th
                      className={`sortable ${sort.field === 'title' ? `sorted-${sort.order}` : ''}`}
                      onClick={() => handleSortChange('title')}
                    >
                      Title
                      <span className="sort-indicator">
                        {sort.field === 'title' ? (sort.order === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </th>
                    <th
                      className={`sortable ${sort.field === 'location' ? `sorted-${sort.order}` : ''}`}
                      onClick={() => handleSortChange('location')}
                    >
                      Location
                      <span className="sort-indicator">
                        {sort.field === 'location' ? (sort.order === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </th>
                    <th>Campsites</th>
                    <th>Reviews</th>
                    <th>Bookings</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campgrounds.map((campground) => (
                    <tr key={campground._id}>
                      <td>
                        <div className="campground-title">
                          <strong>{campground.title}</strong>
                          {campground.images && campground.images.length > 0 && (
                            <span className="image-count">📷 {campground.images.length}</span>
                          )}
                        </div>
                      </td>
                      <td>{campground.location}</td>
                      <td>
                        <span className="count-badge">{campground.campsites?.length || 0}</span>
                      </td>
                      <td>
                        <div className="reviews-info">
                          <span className="count-badge">{campground.reviews?.length || 0}</span>
                          {campground.averageRating && (
                            <span className="rating">⭐ {campground.averageRating.toFixed(1)}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="count-badge">{campground.bookings?.length || 0}</span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${campground.isActive ? 'status-active' : 'status-inactive'}`}
                        >
                          {campground.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{formatDate(campground.createdAt)}</td>
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="owner-pagination">
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

              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages}({pagination.total} total
                campgrounds)
              </span>

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
          )}
        </>
      )}
    </div>
  );
};

export default OwnerCampgroundsPage;
