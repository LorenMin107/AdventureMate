import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import apiClient from '../utils/api';
import ForumPostCard from '../components/ForumPostCard';
import ForumFilter from '../components/ForumFilter';
import ForumStats from '../components/ForumStats';
import CSSIsolationWrapper from '../components/CSSIsolationWrapper';
import { logError } from '../utils/logger';
import './ForumPage.css';

const ForumPage = () => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get filter parameters from URL
  const page = parseInt(searchParams.get('page')) || 1;
  const category = searchParams.get('category') || '';
  const type = searchParams.get('type') || '';
  const sort = searchParams.get('sort') || 'latest';
  const search = searchParams.get('search') || '';
  const tags = searchParams.get('tags') || '';

  // Fetch forum posts
  const {
    data: forumData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['forum', 'posts', { page, category, type, sort, search, tags }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sort,
      });

      if (category) params.append('category', category);
      if (type) params.append('type', type);
      if (search) params.append('search', search);
      if (tags) params.append('tags', tags);

      const response = await apiClient.get(`/forum?${params.toString()}`);
      return response.data.data;
    },
    keepPreviousData: true,
  });

  // Fetch forum stats
  const {
    data: statsData,
    error: statsError,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ['forum', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get('/forum/stats');
      // Defensive: always return an object
      return response.data?.data || {};
    },
    keepPreviousData: true,
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['forum', 'categories'],
    queryFn: async () => {
      const response = await apiClient.get('/forum/categories');
      // Defensive: always return an array
      return response.data?.data?.categories || [];
    },
  });

  const handleFilterChange = (newFilters) => {
    const params = new URLSearchParams();

    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.type) params.set('type', newFilters.type);
    if (newFilters.sort) params.set('sort', newFilters.sort);
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.tags) params.set('tags', newFilters.tags);

    // Reset to page 1 when filters change
    params.set('page', '1');

    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  if (error) {
    logError('Error loading forum posts', error);
    return (
      <CSSIsolationWrapper section="forum" className={`forum-page ${theme}`}>
        <div className="forum-error">
          <h2>{t('forum.errorLoadingForum')}</h2>
          <p>{t('forum.failedToLoadPosts')}</p>
          <button onClick={() => refetch()} className="forum-btn forum-btn-primary">
            {t('forum.retry')}
          </button>
        </div>
      </CSSIsolationWrapper>
    );
  }

  return (
    <CSSIsolationWrapper section="forum" className={`forum-page ${theme}`}>
      <div className="forum-header">
        <div className="forum-header-content">
          <h1>{t('forum.title')}</h1>
          <p>{t('forum.subtitle')}</p>
          {isAuthenticated && (
            <Link to="/forum/new" className="forum-btn forum-btn-primary">
              {t('forum.createNewPost')}
            </Link>
          )}
        </div>
      </div>

      <div className="forum-container">
        <div className="forum-sidebar">
          <ForumStats stats={statsData} error={statsError} isLoading={statsLoading} />

          {categoriesData && (
            <div className="forum-categories">
              <h3>{t('forum.categories')}</h3>
              <div className="category-list">
                <button
                  className={`category-item ${!category ? 'active' : ''}`}
                  onClick={() => handleFilterChange({ category: '' })}
                >
                  <span>📝</span>
                  <span>{t('forum.allPosts')}</span>
                </button>
                {categoriesData.map((cat) => (
                  <button
                    key={cat.value}
                    className={`category-item ${category === cat.value ? 'active' : ''}`}
                    onClick={() => handleFilterChange({ category: cat.value })}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="forum-main">
          {!isAuthenticated && (
            <div className="forum-guest-message">
              <p>
                <Link to="/login">{t('navigation.login')}</Link> {t('forum.loginToParticipate')}
              </p>
            </div>
          )}
          <ForumFilter
            currentFilters={{ category, type, sort, search, tags }}
            onFilterChange={handleFilterChange}
            categories={categoriesData}
          />

          <div className="forum-content">
            {isLoading ? (
              <div className="forum-loading">
                <div className="loading-spinner"></div>
                <p>{t('forum.loadingPosts')}</p>
              </div>
            ) : forumData?.posts?.length === 0 ? (
              <div className="forum-empty">
                <div className="empty-icon">💬</div>
                <h3>{t('forum.noPostsFound')}</h3>
                <p>
                  {search || category || type
                    ? t('forum.adjustSearchCriteria')
                    : t('forum.beFirstToStart')}
                </p>
                {isAuthenticated && (
                  <Link to="/forum/new" className="forum-btn forum-btn-primary">
                    {t('forum.createFirstPost')}
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="forum-posts">
                  {forumData?.posts?.map((post) => (
                    <ForumPostCard key={post._id} post={post} />
                  ))}
                </div>

                {forumData?.pagination && forumData.pagination.totalPages > 1 && (
                  <div className="forum-pagination">
                    <button
                      className="pagination-btn"
                      disabled={!forumData.pagination.hasPrev}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      {t('forum.previous')}
                    </button>

                    <div className="pagination-info">
                      {t('forum.pageInfo', {
                        current: forumData.pagination.currentPage,
                        total: forumData.pagination.totalPages,
                      })}
                    </div>

                    <button
                      className="pagination-btn"
                      disabled={!forumData.pagination.hasNext}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      {t('forum.next')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </CSSIsolationWrapper>
  );
};

export default ForumPage;
