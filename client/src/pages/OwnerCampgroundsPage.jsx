import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFlashMessage } from '../context/FlashMessageContext';
import { useTheme } from '../context/ThemeContext';
import useOwners from '../hooks/useOwners';
import CSSIsolationWrapper from '../components/CSSIsolationWrapper';
import { logError } from '../utils/logger';
import './OwnerCampgroundsPage.css';

/**
 * Owner Campgrounds Page
 * Modern dashboard for campground owners to manage their campgrounds
 */
const OwnerCampgroundsPage = () => {
  const { t } = useTranslation();
  const { showMessage } = useFlashMessage();
  const { theme } = useTheme();
  const { useOwnerCampgrounds } = useOwners();
  const navigate = useNavigate();

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
    field: 'createdAt',
    order: 'desc',
  });

  // Fetch owner's campgrounds
  const {
    data: campgroundsData,
    isLoading,
    error: fetchError,
    refetch,
  } = useOwnerCampgrounds({
    page: pagination.page,
    limit: pagination.limit,
    sort: `${sort.field}:${sort.order}`,
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
      setError(t('commonErrors.failedToLoad', { item: 'campgrounds' }));
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
    const newOrder = sort.field === field && sort.order === 'asc' ? 'desc' : 'asc';
    setSort({ field, order: newOrder });
    setPagination({ ...pagination, page: 1 });
  };

  const handleRowClick = (campgroundId) => {
    navigate(`/owner/campgrounds/${campgroundId}`);
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
      <CSSIsolationWrapper section="owner" className="owner-loading">
        <div className="owner-loading-spinner"></div>
        <p>{t('ownerCampgroundsPage.loading')}</p>
      </CSSIsolationWrapper>
    );
  }

  if (error) {
    return (
      <CSSIsolationWrapper section="owner" className="owner-error">
        <h4>{t('ownerCampgroundsPage.errorTitle')}</h4>
        <p>{error}</p>
        <button onClick={() => refetch()} className="owner-btn owner-btn-primary">
          {t('ownerCampgroundsPage.retry')}
        </button>
      </CSSIsolationWrapper>
    );
  }

  return (
    <CSSIsolationWrapper
      section="owner"
      className={`owner-campgrounds ${theme === 'dark' ? 'dark-theme' : ''}`}
    >
      {/* Enhanced Page Header */}
      <div className="owner-page-header">
        <div className="header-content">
          <div className="header-main">
            <div className="greeting-section">
              <h1>{t('ownerCampgroundsPage.title')}</h1>
              <p className="header-subtitle">{t('ownerCampgroundsPage.subtitle')}</p>
            </div>
            <div className="header-stats">
              <div className="header-stat">
                <span className="stat-label">{t('ownerCampgroundsPage.totalCampgrounds')}</span>
                <span className="stat-value">{pagination.total}</span>
              </div>
              <div className="header-stat">
                <span className="stat-label">{t('ownerCampgroundsPage.activeListings')}</span>
                <span className="stat-value">{campgrounds.filter((c) => c.isActive).length}</span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <Link to="/owner/campgrounds/new" className="owner-btn owner-btn-primary">
              <span className="btn-icon">➕</span>
              {t('ownerCampgroundsPage.addNewCampground')}
            </Link>
            <div className="view-controls">
              <select
                value={pagination.limit}
                onChange={(e) =>
                  setPagination({ ...pagination, page: 1, limit: Number(e.target.value) })
                }
                className="owner-select"
              >
                <option value="5">{t('ownerCampgroundsPage.perPage', { count: 5 })}</option>
                <option value="10">{t('ownerCampgroundsPage.perPage', { count: 10 })}</option>
                <option value="25">{t('ownerCampgroundsPage.perPage', { count: 25 })}</option>
                <option value="50">{t('ownerCampgroundsPage.perPage', { count: 50 })}</option>
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
            <h3>{t('ownerCampgroundsPage.noCampgroundsYet')}</h3>
            <p>{t('ownerCampgroundsPage.noCampgroundsMessage')}</p>
            <div className="empty-actions">
              <Link to="/owner/campgrounds/new" className="owner-btn owner-btn-primary">
                {t('ownerCampgroundsPage.addFirstCampground')}
              </Link>
              <Link to="/owner/dashboard" className="owner-btn owner-btn-outline">
                {t('ownerCampgroundsPage.backToDashboard')}
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Enhanced Campgrounds Table */}
            <div className="owner-card table-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>{t('ownerCampgroundsPage.campgroundListings')}</h3>
                  <span className="card-subtitle">
                    {t('ownerCampgroundsPage.showing', {
                      count: campgrounds.length,
                      total: pagination.total,
                    })}
                  </span>
                </div>
                <div className="table-actions">
                  <span className="sort-info">
                    {t('ownerCampgroundsPage.sortedBy', { field: sort.field, order: sort.order })}
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
                          <span>{t('ownerCampgroundsPage.campground')}</span>
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
                          <span>{t('ownerCampgroundsPage.location')}</span>
                          <span className="sort-indicator">
                            {sort.field === 'location' ? (sort.order === 'asc' ? '↑' : '↓') : '↕'}
                          </span>
                        </div>
                      </th>
                      <th className="text-center">{t('ownerCampgroundsPage.campsites')}</th>
                      <th className="text-center">{t('ownerCampgroundsPage.reviews')}</th>
                      <th className="text-center">{t('ownerCampgroundsPage.bookings')}</th>
                      <th className="text-center">{t('ownerCampgroundsPage.created')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campgrounds.map((campground) => (
                      <tr
                        key={campground._id}
                        className="campground-row"
                        onClick={() => handleRowClick(campground._id)}
                      >
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
                            <span className="metric-label">{t('ownerCampgroundsPage.sites')}</span>
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
                          <div className="date-cell">
                            <span className="date-text">{formatDate(campground.createdAt)}</span>
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
                    {t('ownerCampgroundsPage.first')}
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="owner-btn owner-btn-outline"
                  >
                    {t('ownerCampgroundsPage.previous')}
                  </button>
                </div>

                <div className="pagination-info">
                  <span className="page-info">
                    {t('ownerCampgroundsPage.pageInfo', {
                      current: pagination.page,
                      total: pagination.totalPages,
                    })}
                  </span>
                  <span className="total-info">
                    {t('ownerCampgroundsPage.totalInfo', { count: pagination.total })}
                  </span>
                </div>

                <div className="pagination-controls">
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="owner-btn owner-btn-outline"
                  >
                    {t('ownerCampgroundsPage.next')}
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="owner-btn owner-btn-outline"
                  >
                    {t('ownerCampgroundsPage.last')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </CSSIsolationWrapper>
  );
};

export default OwnerCampgroundsPage;
