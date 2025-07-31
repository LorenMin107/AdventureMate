import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/api';
import { logError } from '../../utils/logger';
import './UserList.css';

/**
 * UserList component displays a paginated list of users for administrators
 *
 * @returns {JSX.Element} User list component
 */
const UserList = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [sort, setSort] = useState({
    field: 'username',
    order: 'asc',
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          page: pagination.page,
          limit: pagination.limit,
          sortField: sort.field,
          sortOrder: sort.order,
        });

        const response = await apiClient.get(`/admin/users?${queryParams}`);

        // Handle the ApiResponse format
        const responseData = response.data;
        const data = responseData.data || responseData; // Handle both ApiResponse format and direct data
        setUsers(data.users || []);
        setPagination(data.pagination || pagination);
        setSort(data.sort || sort);
        setError(null);
      } catch (err) {
        logError('Error fetching users', err);
        // Improved error handling for axios errors
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          'Failed to load users. Please try again later.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.isAdmin) {
      fetchUsers();
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

  if (!currentUser?.isAdmin) {
    return <div className="user-list-unauthorized">{t('userList.unauthorizedMessage')}</div>;
  }

  if (loading) {
    return <div className="user-list-loading">{t('userList.loading')}</div>;
  }

  if (error) {
    return <div className="user-list-error">{error}</div>;
  }

  return (
    <div className="user-list">
      <div className="user-list-header">
        <h1>{t('userList.managementTitle')}</h1>
        <div className="user-list-actions">
          <select
            value={pagination.limit}
            onChange={(e) =>
              setPagination({ ...pagination, page: 1, limit: Number(e.target.value) })
            }
            className="user-list-limit"
          >
            <option value="5">{t('userList.limitOptions.5')}</option>
            <option value="10">{t('userList.limitOptions.10')}</option>
            <option value="25">{t('userList.limitOptions.25')}</option>
            <option value="50">{t('userList.limitOptions.50')}</option>
          </select>
        </div>
      </div>

      <div className="user-list-table-container">
        <table className="user-list-table">
          <thead>
            <tr>
              <th
                className={`sortable ${sort.field === 'username' ? `sorted-${sort.order}` : ''}`}
                onClick={() => handleSortChange('username')}
              >
                {t('userList.table.username')}
              </th>
              <th
                className={`sortable ${sort.field === 'email' ? `sorted-${sort.order}` : ''}`}
                onClick={() => handleSortChange('email')}
              >
                {t('userList.table.email')}
              </th>
              <th>{t('userList.table.role')}</th>
              <th>{t('userList.table.status')}</th>
              <th
                className={`sortable ${sort.field === 'createdAt' ? `sorted-${sort.order}` : ''}`}
                onClick={() => handleSortChange('createdAt')}
              >
                {t('userList.table.joined')}
              </th>
              <th>{t('userList.table.bookings')}</th>
              <th>{t('userList.table.reviews')}</th>
              <th>{t('userList.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <span
                    className={`user-role ${user.isAdmin ? 'admin' : user.isOwner ? 'owner' : 'user'}`}
                  >
                    {user.isAdmin
                      ? t('userList.role.admin')
                      : user.isOwner
                        ? t('userList.role.owner')
                        : t('userList.role.user')}
                  </span>
                </td>
                <td>
                  <span className={`user-status ${user.isSuspended ? 'suspended' : 'active'}`}>
                    {user.isSuspended
                      ? t('userList.status.suspended')
                      : t('userList.status.active')}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>{user.bookings?.length || 0}</td>
                <td>{user.reviews?.length || 0}</td>
                <td>
                  <Link to={`/admin/users/${user._id}`} className="user-list-view-button">
                    {t('userList.actions.view')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="user-list-pagination">
          <button
            onClick={() => handlePageChange(1)}
            disabled={pagination.page === 1}
            className="pagination-button"
          >
            {t('userList.pagination.first')}
          </button>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="pagination-button"
          >
            {t('userList.pagination.previous')}
          </button>
          <span className="pagination-info">
            {t('userList.pagination.pageInfo', {
              currentPage: pagination.page,
              totalPages: pagination.totalPages,
            })}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="pagination-button"
          >
            {t('userList.pagination.next')}
          </button>
          <button
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={pagination.page === pagination.totalPages}
            className="pagination-button"
          >
            {t('userList.pagination.last')}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserList;
