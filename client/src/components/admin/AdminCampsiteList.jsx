import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@context/AuthContext';
import apiClient from '../../utils/api';
import { logError } from '@utils/logger';
import ConfirmDialog from '../common/ConfirmDialog';
import './AdminCampsiteList.css';

/**
 * AdminCampsiteList component displays a paginated list of campsites for administrators
 *
 * @returns {JSX.Element} Campsite list component
 */
const AdminCampsiteList = () => {
  const { t } = useTranslation();
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
    totalPages: 0,
  });
  const [sort, setSort] = useState({
    field: 'name',
    order: 'asc',
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    campsite: null,
  });

  // Fetch all campgrounds for the filter dropdown
  useEffect(() => {
    const fetchCampgrounds = async () => {
      try {
        const response = await apiClient.get('/campgrounds');

        // Handle the ApiResponse format
        const responseData = response.data;
        const data = responseData.data || responseData; // Handle both ApiResponse format and direct data

        const campgroundsList = data.campgrounds || [];
        setCampgrounds(campgroundsList);

        // Auto-select the first campground if there are any
        if (campgroundsList.length > 0) {
          setSelectedCampground(campgroundsList[0]._id);
        }
      } catch (err) {
        logError('Error fetching campgrounds', err);
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
            totalPages: 0,
          });
          setLoading(false);
          return;
        }

        const queryParams = new URLSearchParams({
          page: pagination.page,
          limit: pagination.limit,
          sortField: sort.field,
          sortOrder: sort.order,
        });

        const response = await apiClient.get(
          `/campgrounds/${selectedCampground}/campsites?${queryParams}`
        );

        // Handle the ApiResponse format
        const responseData = response.data;
        const data = responseData.data || responseData; // Handle both ApiResponse format and direct data
        const campsitesData = data.campsites;

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
        logError('Error fetching campsites', err);
        setError(t('adminCampsiteList.failed_to_load_campsites'));
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.isAdmin) {
      fetchCampsites();
    }
  }, [
    selectedCampground,
    pagination.page,
    pagination.limit,
    sort.field,
    sort.order,
    currentUser,
    t,
  ]);

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

  const handleDeleteClick = (campsite) => {
    setDeleteDialog({
      open: true,
      campsite,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await apiClient.delete(`/campsites/${deleteDialog.campsite._id}`);
      setCampsites(campsites.filter((c) => c._id !== deleteDialog.campsite._id));
      setDeleteDialog({ open: false, campsite: null });
    } catch (err) {
      logError('Error deleting campsite', err);
      alert(t('adminCampsiteList.failed_to_delete_campsite'));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, campsite: null });
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="admin-campsite-list-unauthorized">
        {t('adminCampsiteList.no_permission_access_page')}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-campsite-list-loading">{t('adminCampsiteList.loading_campsites')}</div>
    );
  }

  if (error) {
    return <div className="admin-campsite-list-error">{error}</div>;
  }

  if (selectedCampground && campsites.length === 0) {
    return (
      <div className="admin-campsite-list-empty">
        <p>{t('adminCampsiteList.no_campsites_found_for_this_campground')}.</p>
        <Link
          to={`/campgrounds/${selectedCampground}/campsites/new`}
          className="admin-campsite-list-add-link"
        >
          {t('adminCampsiteList.add_a_new_campsite')}
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-campsite-list">
      <div className="admin-campsite-list-header">
        <h1>{t('adminCampsiteList.campsite_management')}</h1>
        <div className="admin-campsite-list-actions">
          <div className="admin-campsite-list-filter">
            <label htmlFor="campground-filter">
              {t('adminCampsiteList.filter_by_campground')}:
            </label>
            <select
              id="campground-filter"
              value={selectedCampground}
              onChange={handleCampgroundChange}
              className="admin-campsite-list-select"
            >
              <option value="">{t('adminCampsiteList.all_campgrounds')}</option>
              {campgrounds.map((campground) => (
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
              {t('adminCampsiteList.add_new_campsite')}
            </Link>
          )}

          <select
            value={pagination.limit}
            onChange={(e) =>
              setPagination({ ...pagination, page: 1, limit: Number(e.target.value) })
            }
            className="admin-campsite-list-limit"
          >
            <option value="5">{t('adminCampsiteList.5_per_page')}</option>
            <option value="10">{t('adminCampsiteList.10_per_page')}</option>
            <option value="25">{t('adminCampsiteList.25_per_page')}</option>
            <option value="50">{t('adminCampsiteList.50_per_page')}</option>
          </select>
        </div>
      </div>

      <div className="admin-campsite-list-table-container">
        <table className="admin-campsite-list-table">
          <thead>
            <tr>
              <th>{t('adminCampsiteList.name')}</th>
              <th>{t('adminCampsiteList.price')}</th>
              <th>{t('adminCampsiteList.capacity')}</th>
              <th>{t('adminCampsiteList.features')}</th>
              <th>{t('adminCampsiteList.availability')}</th>
              <th>{t('adminCampsiteList.bookings')}</th>
              <th>{t('adminCampsiteList.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {campsites.map((campsite) => (
              <tr key={campsite._id}>
                <td>{campsite.name}</td>
                <td>${campsite.price}</td>
                <td>
                  {campsite.capacity}{' '}
                  {campsite.capacity === 1
                    ? t('adminCampsiteList.person')
                    : t('adminCampsiteList.people')}
                </td>
                <td>
                  {campsite.features && campsite.features.length > 0
                    ? campsite.features.join(', ')
                    : t('adminCampsiteList.none')}
                </td>
                <td>
                  <span
                    className={`admin-campsite-list-availability ${
                      campsite.availability ? 'available' : 'unavailable'
                    }`}
                  >
                    {campsite.availability
                      ? t('adminCampsiteList.available')
                      : t('adminCampsiteList.unavailable')}
                  </span>
                </td>
                <td>{campsite.bookings?.length || 0}</td>
                <td className="admin-campsite-list-actions-cell">
                  <Link
                    to={`/campsites/${campsite._id}`}
                    className="admin-campsite-list-view-button"
                  >
                    {t('adminCampsiteList.view')}
                  </Link>
                  <Link
                    to={`/campsites/${campsite._id}/edit`}
                    className="admin-campsite-list-edit-button"
                  >
                    {t('adminCampsiteList.edit')}
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(campsite)}
                    className="admin-campsite-list-delete-button"
                  >
                    {t('adminCampsiteList.delete')}
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
            {t('adminCampsiteList.first')}
          </button>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="admin-campsite-list-pagination-button"
          >
            {t('adminCampsiteList.previous')}
          </button>
          <span className="admin-campsite-list-pagination-info">
            {t('adminCampsiteList.page')} {pagination.page} {t('adminCampsiteList.of')}{' '}
            {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="admin-campsite-list-pagination-button"
          >
            {t('adminCampsiteList.next')}
          </button>
          <button
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={pagination.page === pagination.totalPages}
            className="admin-campsite-list-pagination-button"
          >
            {t('adminCampsiteList.last')}
          </button>
        </div>
      )}

      {!selectedCampground && (
        <div className="admin-campsite-list-select-prompt">
          <p>{t('adminCampsiteList.view_all_campgrounds_select_prompt')}</p>
        </div>
      )}

      {campgrounds.length === 0 && (
        <div className="admin-campsite-list-empty">
          <p>{t('adminCampsiteList.no_campgrounds_found_create_campground_first')}.</p>
          <Link to="/campgrounds/new" className="admin-campsite-list-add-link">
            {t('adminCampsiteList.create_new_campground')}
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('adminCampsiteList.delete_campsite')}
        message={`${t('adminCampsiteList.are_you_sure_delete')}"${deleteDialog.campsite?.name}"? ${t('adminCampsiteList.this_action_cannot_be_undone')}.`}
        confirmLabel={t('adminCampsiteList.delete')}
        cancelLabel={t('adminCampsiteList.cancel')}
      />
    </div>
  );
};

export default AdminCampsiteList;
