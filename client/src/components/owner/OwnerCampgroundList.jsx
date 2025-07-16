import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFlashMessage } from '../../context/FlashMessageContext';
import { useTheme } from '../../context/ThemeContext';
import useOwners from '../../hooks/useOwners';
import { logError } from '../../utils/logger';
import './OwnerCampgroundList.css';

/**
 * OwnerCampgroundList component displays and manages campgrounds owned by the current owner
 */
const OwnerCampgroundList = () => {
  const { t } = useTranslation();
  const { showMessage } = useFlashMessage();
  const { theme } = useTheme();
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
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset to page 1 when other filters change
    }));
  };

  const handleDelete = async (campgroundId, campgroundTitle) => {
    if (!window.confirm(t('ownerCampgroundList.deleteConfirm', { title: campgroundTitle }))) {
      return;
    }

    try {
      await deleteCampgroundMutation.mutateAsync(campgroundId);
      showMessage(t('ownerCampgroundList.deleteSuccess'), 'success');
      refetch();
    } catch (error) {
      logError('Error deleting campground', error);
      showMessage(error.response?.data?.message || t('ownerCampgroundList.deleteError'), 'error');
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
        <p>{t('ownerCampgroundList.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-error">
        <h4>{t('ownerCampgroundList.errorTitle')}</h4>
        <p>{t('ownerCampgroundList.errorMessage')}</p>
        <button onClick={() => refetch()} className="owner-btn owner-btn-primary">
          {t('ownerCampgroundList.retry')}
        </button>
      </div>
    );
  }

  const { campgrounds = [], pagination = {} } = data || {};

  return (
    <div className={`owner-campground-list ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Page Header */}
      <div className="owner-page-header">
        <div className="header-content">
          <div>
            <h1>{t('ownerCampgroundList.title')}</h1>
            <p>{t('ownerCampgroundList.subtitle')}</p>
          </div>
          <div className="header-actions">
            <Link to="/owner/campgrounds/new" className="owner-btn owner-btn-primary">
              <span>➕</span>
              {t('ownerCampgroundList.addNewCampground')}
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="owner-card">
        <div className="filters-container">
          <div className="filter-group">
            <label htmlFor="search">{t('ownerCampgroundList.searchCampgrounds')}</label>
            <input
              type="text"
              id="search"
              placeholder={t('ownerCampgroundList.searchPlaceholder')}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="limit">{t('ownerCampgroundList.itemsPerPage')}</label>
            <select
              id="limit"
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
              className="filter-select"
            >
              <option value="5">{t('ownerCampgroundList.perPage', { count: 5 })}</option>
              <option value="10">{t('ownerCampgroundList.perPage', { count: 10 })}</option>
              <option value="25">{t('ownerCampgroundList.perPage', { count: 25 })}</option>
              <option value="50">{t('ownerCampgroundList.perPage', { count: 50 })}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campgrounds List */}
      <div className="owner-card">
        {campgrounds.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏕️</div>
            <h3>{t('ownerCampgroundList.noCampgroundsFound')}</h3>
            {filters.search ? (
              <p>{t('ownerCampgroundList.noSearchResults')}</p>
            ) : (
              <p>{t('ownerCampgroundList.noCampgroundsYet')}</p>
            )}
            <Link to="/owner/campgrounds/new" className="owner-btn owner-btn-primary">
              {t('ownerCampgroundList.addFirstCampground')}
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
                        <span className="stat-label">{t('ownerCampgroundList.campsites')}</span>
                        <span className="stat-value">{campground.stats?.totalCampsites || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">{t('ownerCampgroundList.bookings')}</span>
                        <span className="stat-value">{campground.stats?.totalBookings || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">{t('ownerCampgroundList.revenue')}</span>
                        <span className="stat-value">
                          {formatCurrency(campground.stats?.totalRevenue)}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">{t('ownerCampgroundList.rating')}</span>
                        <span className="stat-value">
                          {campground.stats?.averageRating
                            ? `⭐ ${campground.stats.averageRating}`
                            : t('ownerCampgroundList.noRatings')}
                        </span>
                      </div>
                    </div>

                    <div className="campground-actions">
                      <Link
                        to={`/campgrounds/${campground._id}`}
                        className="owner-btn owner-btn-outline"
                        target="_blank"
                      >
                        {t('ownerCampgroundList.viewPublic')}
                      </Link>
                      <Link
                        to={`/owner/campgrounds/${campground._id}`}
                        className="owner-btn owner-btn-secondary"
                      >
                        {t('ownerCampgroundList.manage')}
                      </Link>
                      <Link
                        to={`/owner/campgrounds/${campground._id}/edit`}
                        className="owner-btn owner-btn-primary"
                      >
                        {t('ownerCampgroundList.edit')}
                      </Link>
                      <button
                        onClick={() => handleDelete(campground._id, campground.title)}
                        className="owner-btn owner-btn-danger"
                        disabled={deleteCampgroundMutation.isLoading}
                      >
                        {t('ownerCampgroundList.delete')}
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
                  {t('ownerCampgroundList.previous')}
                </button>

                <span className="pagination-info">
                  {t('ownerCampgroundList.paginationInfo', {
                    current: pagination.page,
                    total: pagination.pages,
                    count: pagination.total,
                  })}
                </span>

                <button
                  onClick={() => handleFilterChange('page', pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="owner-btn owner-btn-secondary"
                >
                  {t('ownerCampgroundList.next')}
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
