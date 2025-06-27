import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminCampsiteList.css';

/**
 * AdminCampsiteList component displays a paginated list of campsites for administrators
 * 
 * @returns {JSX.Element} Campsite list component
 */
const AdminCampsiteList = () => {
  const { currentUser } = useAuth();
  const [campsites, setCampsites] = useState([]);
  const [campgrounds, setCampgrounds] = useState([]);
  const [selectedCampground, setSelectedCampground] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [sort, setSort] = useState({
    field: 'name',
    order: 'asc'
  });

  // Fetch all campgrounds for the filter dropdown
  useEffect(() => {
    const fetchCampgrounds = async () => {
      try {
        const response = await fetch('/api/campgrounds', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch campgrounds: ${response.status}`);
        }

        const data = await response.json();

        // Check if the response is in the new standardized format
        const responseData = data.status && data.data ? data.data : data;

        const campgroundsList = responseData.campgrounds || [];
        setCampgrounds(campgroundsList);

        // No auto-selection of campgrounds - we want "All Campgrounds" to be the default
      } catch (err) {
        console.error('Error fetching campgrounds:', err);
        // Don't set error state here, as we'll still try to fetch campsites
      }
    };

    if (currentUser?.isAdmin) {
      fetchCampgrounds();
    }
  }, [currentUser]);

  // Fetch campsites based on selected campground and pagination/sorting
  useEffect(() => {
    const fetchCampsites = async () => {
      try {
        setLoading(true);

        // If no campground is selected, we can't fetch campsites
        if (!selectedCampground) {
          setCampsites([]);
          setPagination({
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          });
          setLoading(false);
          return;
        }

        const queryParams = new URLSearchParams({
          page: pagination.page,
          limit: pagination.limit,
          sortField: sort.field,
          sortOrder: sort.order
        });

        const response = await fetch(`/api/v1/campgrounds/${selectedCampground}/campsites?${queryParams}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch campsites: ${response.status}`);
        }

        const data = await response.json();

        // Check if the response is in the standardized format
        const campsitesData = data.status && data.data ? data.data.campsites : data.campsites;

        if (!campsitesData) {
          throw new Error('Campsites data not found in response');
        }

        setCampsites(campsitesData);

        // If pagination info is available in the response, use it
        if (data.pagination) {
          setPagination(data.pagination);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching campsites:', err);
        setError('Failed to load campsites. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.isAdmin) {
      fetchCampsites();
    }
  }, [selectedCampground, pagination.page, pagination.limit, sort.field, sort.order, currentUser]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination({ ...pagination, page: newPage });
  };

  const handleSortChange = (field) => {
    // If clicking the same field, toggle order
    const newOrder = field === sort.field && sort.order === 'asc' ? 'desc' : 'asc';
    setSort({ field, order: newOrder });
  };

  const handleCampgroundChange = (e) => {
    setSelectedCampground(e.target.value);
    // Reset pagination when changing campground
    setPagination({ ...pagination, page: 1 });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/campsites/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete campsite: ${response.status}`);
      }

      // Update the campsites list
      setCampsites(campsites.filter(campsite => campsite._id !== id));
    } catch (err) {
      console.error('Error deleting campsite:', err);
      alert('Failed to delete campsite. Please try again later.');
    }
  };

  if (!currentUser?.isAdmin) {
    return <div className="admin-campsite-list-unauthorized">You do not have permission to access this page.</div>;
  }

  return (
    <div className="admin-campsite-list">
      <div className="admin-campsite-list-header">
        <h1>Campsite Management</h1>
        <div className="admin-campsite-list-actions">
          <div className="admin-campsite-list-filter">
            <label htmlFor="campground-filter">Filter by Campground:</label>
            <select 
              id="campground-filter"
              value={selectedCampground} 
              onChange={handleCampgroundChange}
              className="admin-campsite-list-select"
            >
              <option value="">All Campgrounds</option>
              {campgrounds.map(campground => (
                <option key={campground._id} value={campground._id}>
                  {campground.title}
                </option>
              ))}
            </select>
          </div>

          {selectedCampground && (
            <Link 
              to={`/campgrounds/${selectedCampground}/campsites/new`} 
              className="admin-campsite-list-add-button"
            >
              Add New Campsite
            </Link>
          )}

          <select 
            value={pagination.limit} 
            onChange={(e) => setPagination({ ...pagination, page: 1, limit: Number(e.target.value) })}
            className="admin-campsite-list-limit"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      {selectedCampground ? (
        loading ? (
          <div className="admin-campsite-list-loading">Loading campsites...</div>
        ) : error ? (
          <div className="admin-campsite-list-error">{error}</div>
        ) : campsites.length === 0 ? (
          <div className="admin-campsite-list-empty">
            No campsites found for this campground. 
            <Link 
              to={`/campgrounds/${selectedCampground}/campsites/new`} 
              className="admin-campsite-list-add-link"
            >
              Add a new campsite
            </Link>
          </div>
        ) : (
          <>
            <div className="admin-campsite-list-table-container">
              <table className="admin-campsite-list-table">
                <thead>
                  <tr>
                    <th 
                      className={`sortable ${sort.field === 'name' ? `sorted-${sort.order}` : ''}`}
                      onClick={() => handleSortChange('name')}
                    >
                      Name
                    </th>
                    <th 
                      className={`sortable ${sort.field === 'price' ? `sorted-${sort.order}` : ''}`}
                      onClick={() => handleSortChange('price')}
                    >
                      Price
                    </th>
                    <th 
                      className={`sortable ${sort.field === 'capacity' ? `sorted-${sort.order}` : ''}`}
                      onClick={() => handleSortChange('capacity')}
                    >
                      Capacity
                    </th>
                    <th>Features</th>
                    <th 
                      className={`sortable ${sort.field === 'availability' ? `sorted-${sort.order}` : ''}`}
                      onClick={() => handleSortChange('availability')}
                    >
                      Availability
                    </th>
                    <th>Bookings</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campsites.map(campsite => (
                    <tr key={campsite._id}>
                      <td>{campsite.name}</td>
                      <td>${campsite.price}</td>
                      <td>{campsite.capacity} {campsite.capacity === 1 ? 'person' : 'people'}</td>
                      <td>
                        <div className="admin-campsite-list-features">
                          {campsite.features && campsite.features.length > 0 ? 
                            campsite.features.map((feature, index) => (
                              <span key={index} className="admin-campsite-list-feature-tag">
                                {feature}
                              </span>
                            )) : 
                            'None'
                          }
                        </div>
                      </td>
                      <td>
                        <span className={`admin-campsite-list-availability ${campsite.availability ? 'available' : 'unavailable'}`}>
                          {campsite.availability ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td>{campsite.bookings?.length || 0}</td>
                      <td className="admin-campsite-list-actions-cell">
                        <Link 
                          to={`/campsites/${campsite._id}`} 
                          className="admin-campsite-list-view-button"
                        >
                          View
                        </Link>
                        <Link 
                          to={`/campsites/${campsite._id}/edit`} 
                          className="admin-campsite-list-edit-button"
                        >
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDelete(campsite._id, campsite.name)}
                          className="admin-campsite-list-delete-button"
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
              <div className="admin-campsite-list-pagination">
                <button 
                  onClick={() => handlePageChange(1)} 
                  disabled={pagination.page === 1}
                  className="admin-campsite-list-pagination-button"
                >
                  First
                </button>
                <button 
                  onClick={() => handlePageChange(pagination.page - 1)} 
                  disabled={pagination.page === 1}
                  className="admin-campsite-list-pagination-button"
                >
                  Previous
                </button>
                <span className="admin-campsite-list-pagination-info">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button 
                  onClick={() => handlePageChange(pagination.page + 1)} 
                  disabled={pagination.page === pagination.totalPages}
                  className="admin-campsite-list-pagination-button"
                >
                  Next
                </button>
                <button 
                  onClick={() => handlePageChange(pagination.totalPages)} 
                  disabled={pagination.page === pagination.totalPages}
                  className="admin-campsite-list-pagination-button"
                >
                  Last
                </button>
              </div>
            )}
          </>
        )
      ) : (
        <div className="admin-campsite-list-select-prompt">
          {campgrounds.length > 0 
            ? "You are viewing all campgrounds. Select a specific campground from the dropdown to view its campsites." 
            : (
              <>
                No campgrounds found. Please create a campground first before adding campsites.
                <Link to="/campgrounds/new" className="admin-campsite-list-add-link" style={{ display: 'block', marginTop: '1rem' }}>
                  Create a New Campground
                </Link>
              </>
            )}
        </div>
      )}
    </div>
  );
};

export default AdminCampsiteList;
