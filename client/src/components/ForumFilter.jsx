import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import './ForumFilter.css';

const ForumFilter = ({ currentFilters, onFilterChange, categories }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const sortOptions = [
    { value: 'latest', label: t('forum.sortOptions.latest') },
    { value: 'oldest', label: t('forum.sortOptions.oldest') },
    { value: 'most_voted', label: t('forum.sortOptions.mostVoted') },
    { value: 'most_replied', label: t('forum.sortOptions.mostReplied') },
    { value: 'most_viewed', label: t('forum.sortOptions.mostViewed') },
    { value: 'trending', label: t('forum.sortOptions.trending') },
  ];

  const typeOptions = [
    { value: '', label: t('forum.typeOptions.allTypes') },
    { value: 'discussion', label: t('forum.typeOptions.discussion') },
    { value: 'question', label: t('forum.typeOptions.question') },
  ];

  const handleFilterChange = (key, value) => {
    onFilterChange({
      ...currentFilters,
      [key]: value,
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const search = formData.get('search');
    handleFilterChange('search', search);
  };

  const clearFilters = () => {
    onFilterChange({
      category: '',
      type: '',
      sort: 'latest',
      search: '',
      tags: '',
    });
  };

  const hasActiveFilters = Object.values(currentFilters).some(
    (value) => value && value !== 'latest'
  );

  return (
    <div className={`forum-filter ${theme}`}>
      <div className="filter-header">
        <h3>{t('forum.filters')}</h3>
        <button
          className="expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? t('forum.collapseFilters') : t('forum.expandFilters')}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      <div className={`filter-content ${isExpanded ? 'expanded' : ''}`}>
        {/* Search */}
        <div className="filter-section">
          <label htmlFor="search" className="filter-label">
            {t('forum.searchPosts')}
          </label>
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              id="search"
              name="search"
              placeholder={t('forum.searchPostsPlaceholder')}
              defaultValue={currentFilters.search}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              🔍
            </button>
          </form>
        </div>

        {/* Category Filter */}
        <div className="filter-section">
          <label htmlFor="category" className="filter-label">
            {t('forum.category')}
          </label>
          <select
            id="category"
            value={currentFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
          >
            <option value="">{t('forum.allCategories')}</option>
            {categories?.map((category) => (
              <option key={category.value} value={category.value}>
                {category.icon} {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="filter-section">
          <label htmlFor="type" className="filter-label">
            {t('forum.postType')}
          </label>
          <select
            id="type"
            value={currentFilters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="filter-select"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Options */}
        <div className="filter-section">
          <label htmlFor="sort" className="filter-label">
            {t('forum.sortBy')}
          </label>
          <select
            id="sort"
            value={currentFilters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="filter-select"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tags Filter */}
        <div className="filter-section">
          <label htmlFor="tags" className="filter-label">
            {t('forum.tagsCommaSeparated')}
          </label>
          <input
            type="text"
            id="tags"
            placeholder={t('forum.tagsPlaceholder')}
            value={currentFilters.tags}
            onChange={(e) => handleFilterChange('tags', e.target.value)}
            className="filter-input"
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="filter-section">
            <button onClick={clearFilters} className="clear-filters-btn">
              {t('forum.clearAllFilters')}
            </button>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="active-filters">
            <h4>{t('forum.activeFilters')}</h4>
            <div className="filter-tags">
              {currentFilters.category && (
                <span className="filter-tag">
                  {t('forum.filterTagCategory')}{' '}
                  {categories?.find((c) => c.value === currentFilters.category)?.label ||
                    currentFilters.category}
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className="remove-filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {currentFilters.type && (
                <span className="filter-tag">
                  {t('forum.filterTagType')}{' '}
                  {typeOptions.find((t) => t.value === currentFilters.type)?.label}
                  <button onClick={() => handleFilterChange('type', '')} className="remove-filter">
                    ×
                  </button>
                </span>
              )}
              {currentFilters.search && (
                <span className="filter-tag">
                  {t('forum.filterTagSearch')} "{currentFilters.search}"
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="remove-filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {currentFilters.tags && (
                <span className="filter-tag">
                  {t('forum.filterTagTags')} {currentFilters.tags}
                  <button onClick={() => handleFilterChange('tags', '')} className="remove-filter">
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumFilter;
