import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFlashMessage } from '../../context/FlashMessageContext';
import useOwners from '../../hooks/useOwners';
import './OwnerCampgroundList.css';

/**
 * OwnerCampgroundList component displays and manages campgrounds owned by the current owner
 */
const OwnerCampgroundList = () => {
  const { showMessage } = useFlashMessage();
  const { useOwnerCampgrounds, useDeleteCampground } = useOwners();
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
  });

  // Fetch owner campgrounds
  const { data, isLoading, error, refetch } = useOwnerCampgrounds(filters);
  const deleteCampgroundMutation = useDeleteCampground();

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when other filters change
    }));
  };

  const handleDelete = async (campgroundId, campgroundTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${campgroundTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteCampgroundMutation.mutateAsync(campgroundId);
      showMessage('Campground deleted successfully', 'success');
      refetch();
    } catch (error) {
      console.error('Error deleting campground:', error);
      showMessage(
        error.response?.data?.message || 'Failed to delete campground. Please try again.',
        'error'
      );
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  if (isLoading) {
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
        <p>There was an error loading your campgrounds. Please try again later.</p>
        <button onClick={() => refetch()} className="owner-btn owner-btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const { campgrounds = [], pagination = {} } = data || {};

  return (
    <div className="owner-campground-list">
      {/* Page Header */}
      <div className="owner-page-header">
        <div className="header-content">
          <div>
            <h1>My Campgrounds</h1>
            <p>Manage your campground listings and track their performance.</p>
          </div>
          <div className="header-actions">
            <Link to="/owner/campgrounds/new" className="owner-btn owner-btn-primary">
              <span>➕</span>
              Add New Campground
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="owner-card">
        <div className="filters-container">
          <div className="filter-group">
            <label htmlFor="search">Search Campgrounds</label>
            <input
              type="text"
              id="search"
              placeholder="Search by title, description, or location..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="filter-input"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="limit">Items per page</label>
            <select
              id="limit"
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
              className="filter-select"
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campgrounds List */}
      <div className="owner-card">
        {campgrounds.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏕️</div>
            <h3>No Campgrounds Found</h3>
            {filters.search ? (
              <p>No campgrounds match your search criteria. Try adjusting your search terms.</p>
            ) : (
              <p>You haven't added any campgrounds yet. Start by creating your first campground listing.</p>
            )}
            <Link to="/owner/campgrounds/new" className="owner-btn owner-btn-primary">
              Add Your First Campground
            </Link>
          </div>
        ) : (
          <>
            <div className="campgrounds-grid">
              {campgrounds.map((campground) => (
                <div key={campground._id} className="campground-card">
                  <div className="campground-image">
                    {campground.images && campground.images.length > 0 ? (
                      <img 
                        src={campground.images[0].url} 
                        alt={campground.title}
                        onError={(e) => {
                          e.target.src = '/placeholder-campground.jpg';
                        }}
                      />
                    ) : (
                      <div className="placeholder-image">
                        <span>🏕️</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="campground-content">
                    <div className="campground-header">
                      <h3>{campground.title}</h3>
                      <p className="campground-location">{campground.location}</p>
                    </div>
                    
                    <div className="campground-stats">
                      <div className="stat-item">
                        <span className="stat-label">Campsites</span>
                        <span className="stat-value">{campground.stats?.totalCampsites || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Bookings</span>
                        <span className="stat-value">{campground.stats?.totalBookings || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Revenue</span>
                        <span className="stat-value">{formatCurrency(campground.stats?.totalRevenue)}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Rating</span>
                        <span className="stat-value">
                          {campground.stats?.averageRating ? 
                            `⭐ ${campground.stats.averageRating}` : 
                            'No ratings'
                          }
                        </span>
                      </div>
                    </div>
                    
                    <div className="campground-actions">
                      <Link 
                        to={`/campgrounds/${campground._id}`}
                        className="owner-btn owner-btn-outline"
                        target="_blank"
                      >
                        View Public
                      </Link>
                      <Link 
                        to={`/owner/campgrounds/${campground._id}`}
                        className="owner-btn owner-btn-secondary"
                      >
                        Manage
                      </Link>
                      <Link 
                        to={`/owner/campgrounds/${campground._id}/edit`}
                        className="owner-btn owner-btn-primary"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(campground._id, campground.title)}
                        className="owner-btn owner-btn-danger"
                        disabled={deleteCampgroundMutation.isLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination-container">
                <button
                  onClick={() => handleFilterChange('page', pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="owner-btn owner-btn-secondary"
                >
                  Previous
                </button>
                
                <span className="pagination-info">
                  Page {pagination.page} of {pagination.pages} 
                  ({pagination.total} total campgrounds)
                </span>
                
                <button
                  onClick={() => handleFilterChange('page', pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="owner-btn owner-btn-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OwnerCampgroundList;