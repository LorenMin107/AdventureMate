import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import CampgroundCard from './CampgroundCard';
import VirtualList from './common/VirtualList';
import useCampgrounds from '../hooks/useCampgrounds';
import apiClient from '../utils/api';
import './CampgroundList.css';

/**
 * CampgroundList component displays a grid of campground cards
 * with filtering capabilities
 *
 * @param {Object} props - Component props
 * @param {string} props.searchTerm - Search term for filtering campgrounds
 * @param {string} props.sortOption - Sort option for campgrounds
 * @param {Array} props.campgrounds - Pre-filtered and sorted campgrounds
 */
const CampgroundList = ({ searchTerm = '', sortOption = 'default', campgrounds = [] }) => {
  const { t } = useTranslation();

  // Use the custom hook to fetch all campgrounds if no campgrounds are provided
  const { useAllCampgrounds } = useCampgrounds();
  const { data, isLoading, isError, error, refetch } = useAllCampgrounds({
    // Enable refetching when search term changes
    enabled: campgrounds.length === 0,
  });

  // Use provided campgrounds or fetch from API
  const campgroundsToDisplay = campgrounds.length > 0 ? campgrounds : data?.campgrounds || [];

  // Filter campgrounds by search term (only if not already filtered)
  const filteredCampgrounds = useMemo(() => {
    // If campgrounds are already filtered and sorted, return them as is
    if (campgrounds.length > 0) {
      return campgrounds;
    }

    // Otherwise, apply filters
    return campgroundsToDisplay.filter((campground) => {
      // Check if campground matches the search term
      const matchesSearchTerm =
        !searchTerm ||
        campground.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campground.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campground.location.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearchTerm;
    });
  }, [campgrounds, campgroundsToDisplay, searchTerm]);

  // Handle loading state
  if (isLoading && campgrounds.length === 0) {
    return (
      <div className="loading-message">
        <div className="spinner"></div>
        <p>{t('campgroundList.loading')}</p>
      </div>
    );
  }

  // Handle error state
  if (isError && campgrounds.length === 0) {
    return (
      <div className="error-message">
        <h3>{t('campgroundList.error.title')}</h3>
        <p>{error?.message || t('campgroundList.error.message')}</p>
        <button onClick={() => refetch()} className="btn btn-primary">
          {t('campgroundList.error.tryAgain')}
        </button>
      </div>
    );
  }

  // Handle empty state
  if (filteredCampgrounds.length === 0) {
    return (
      <div className="no-results">
        <h3>{t('campgroundList.noResults.title')}</h3>
        <p>{t('campgroundList.noResults.message')}</p>
      </div>
    );
  }

  // Render function for virtual list items
  const renderCampgroundItem = (campground, index) => (
    <div className="campground-item" key={campground._id}>
      <CampgroundCard campground={campground} />
    </div>
  );

  // Use virtual scrolling for large datasets (more than 50 items)
  const useVirtualScrolling = filteredCampgrounds.length > 50;

  return (
    <div className="campground-list-container">
      <div className="campground-list-header">
        <div className="results-count">
          {t('campgroundList.resultsCount', {
            count: filteredCampgrounds.length,
            plural: filteredCampgrounds.length !== 1 ? 's' : '',
          })}
        </div>
        {useVirtualScrolling && (
          <div className="virtual-scrolling-indicator">{t('campgroundList.virtualScrolling')}</div>
        )}
      </div>

      {useVirtualScrolling ? (
        <VirtualList
          items={filteredCampgrounds}
          itemHeight={300} // Approximate height of campground card
          containerHeight={600}
          buffer={3}
          renderItem={renderCampgroundItem}
          loading={isLoading}
          error={isError ? error?.message : null}
          emptyMessage={t('campgroundList.noResults.message')}
          className="campground-virtual-list"
          itemClassName="campground-virtual-item"
        />
      ) : (
        <div className="campground-list grid">
          {filteredCampgrounds.map((campground) => (
            <div className="campground-item" key={campground._id}>
              <CampgroundCard campground={campground} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampgroundList;
