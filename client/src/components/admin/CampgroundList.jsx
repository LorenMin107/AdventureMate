import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/api';
import { logError, logInfo } from '../../utils/logger';
import ConfirmDialog from '../common/ConfirmDialog';
import './CampgroundList.css';

/**
 * CampgroundList component displays a paginated list of campgrounds for administrators
 *
 * @returns {JSX.Element} Campground list component
 */
const CampgroundList = () => {
  const { currentUser } = useAuth();
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
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    campground: null,
  });

  useEffect(() => {
    const fetchCampgrounds = async () => {
      try {
        setLoading(true);
        // If sort field is 'price', change it to 'title' since price is no longer a field
        const sortField = sort.field === 'price' ? 'title' : sort.field;

        const queryParams = new URLSearchParams({
          page: pagination.page,
          limit: pagination.limit,
          sortField: sortField,
          sortOrder: sort.order,
        });

        const response = await apiClient.get(`/campgrounds?${queryParams}`);
        const data = response.data;

        // Check if the response is in the new standardized format
        const responseData = data.status && data.data ? data.data : data;

        const campgroundsData = responseData.campgrounds || [];

        // Debug: Log the first campground to see the data structure
        if (campgroundsData.length > 0) {
          console.log('First campground data:', campgroundsData[0]);
          console.log('Author field:', campgroundsData[0].author);
          console.log('Owner field:', campgroundsData[0].owner);
        }

        setCampgrounds(campgroundsData);
        setPagination(responseData.pagination || pagination);
        setSort(responseData.sort || sort);
        setError(null);
      } catch (err) {
        logError('Error fetching campgrounds', err);
        setError('Failed to load campgrounds. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.isAdmin) {
      fetchCampgrounds();
    }
  }, [pagination.page, pagination.limit, sort.field, sort.order, currentUser]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination({ ...pagination, page: newPage });
  };

  const handleSortChange = (field) => {
    // If clicking the same field, toggle order
    const newOrder = field === sort.field && sort.order === 'asc' ? 'desc' : 'asc';
    setSort({ field, order: newOrder });
  };

  const handleDeleteClick = (campground) => {
    setDeleteDialog({
      open: true,
      campground,
    });
  };

  const handleDeleteConfirm = async () => {
    const { campground } = deleteDialog;

    try {
      const response = await apiClient.delete(`/campgrounds/${campground._id}`);
      logInfo('Delete response', response.data);

      // Update the campgrounds list
      setCampgrounds(campgrounds.filter((c) => c._id !== campground._id));

      // Close the dialog
      setDeleteDialog({ open: false, campground: null });
    } catch (err) {
      logError('Error deleting campground', err);
      alert('Failed to delete campground. Please try again later.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, campground: null });
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="campground-list-unauthorized">
        You do not have permission to access this page.
      </div>
    );
  }

  if (loading) {
    return <div className="campground-list-loading">Loading campgrounds...</div>;
  }

  if (error) {
    return <div className="campground-list-error">{error}</div>;
  }

  return (
    <div className="admin-campground-list">
      <div className="campground-list-header">
        <h1>Campground Management</h1>
        <div className="campground-list-actions">
          <Link to="/campgrounds/new" className="campground-list-add-button">
            Add New Campground
          </Link>
          <select
            value={pagination.limit}
            onChange={(e) =>
              setPagination({ ...pagination, page: 1, limit: Number(e.target.value) })
            }
            className="campground-list-limit"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      <div className="campground-list-table-container">
        <table className="campground-list-table">
          <thead>
            <tr>
              <th
                className={`sortable ${sort.field === 'title' ? `sorted-${sort.order}` : ''}`}
                onClick={() => handleSortChange('title')}
              >
                Title
              </th>
              <th
                className={`sortable ${sort.field === 'location' ? `sorted-${sort.order}` : ''}`}
                onClick={() => handleSortChange('location')}
              >
                Location
              </th>
              <th>Pricing</th>
              <th>Author</th>
              <th>Reviews</th>
              <th>Bookings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campgrounds.map((campground) => (
              <tr key={campground._id}>
                <td>{campground.title}</td>
                <td>{campground.location}</td>
                <td>
                  {campground.campsites && campground.campsites.length > 0
                    ? (() => {
                        const prices = campground.campsites
                          .map((c) => c.price)
                          .filter((price) => price && price > 0);

                        if (prices.length === 0) {
                          return 'Contact for pricing';
                        }

                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);

                        return minPrice === maxPrice
                          ? `$${minPrice}/night`
                          : `$${minPrice} - $${maxPrice}/night`;
                      })()
                    : 'No campsites'}
                </td>
                <td>{campground.author?.username || campground.owner?.username || 'Unknown'}</td>
                <td>{campground.reviews?.length || 0}</td>
                <td>{campground.bookings?.length || 0}</td>
                <td className="campground-list-actions-cell">
                  <Link
                    to={`/campgrounds/${campground._id}`}
                    className="campground-list-view-button"
                  >
                    View
                  </Link>
                  <Link
                    to={`/campgrounds/${campground._id}/edit`}
                    className="campground-list-edit-button"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(campground)}
                    className="campground-list-delete-button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="campground-list-pagination">
          <button
            onClick={() => handlePageChange(1)}
            disabled={pagination.page === 1}
            className="pagination-button"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="pagination-button"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={pagination.page === pagination.totalPages}
            className="pagination-button"
          >
            Last
          </button>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Campground"
        message={`Are you sure you want to delete "${deleteDialog.campground?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default CampgroundList;
