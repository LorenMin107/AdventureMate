import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CampgroundList from '../components/CampgroundList';
import ClusterMap from '../components/maps/ClusterMap';
import SearchAutocomplete from '../components/SearchAutocomplete';
import { useAuth } from '../context/AuthContext';
import useCampgrounds from '../hooks/useCampgrounds';
import './CampgroundsPage.css';

/**
 * CampgroundsPage component displays a list of campgrounds with search and filter options
 */
const CampgroundsPage = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('default');
  const [isSearching, setIsSearching] = useState(false);

  // Use the custom hook to fetch campgrounds
  const { useAllCampgrounds } = useCampgrounds();
  const { data, isLoading, isError, error } = useAllCampgrounds();

  // Extract campgrounds from data
  const campgrounds = data?.campgrounds || [];

  // Filter and sort campgrounds
  const filteredAndSortedCampgrounds = campgrounds
    .filter((campground) => {
      // Check if campground matches the search term
      const matchesSearchTerm =
        !searchTerm ||
        campground.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campground.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campground.location.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearchTerm;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'price-low-high':
          return (a.startingPrice || 0) - (b.startingPrice || 0);
        case 'price-high-low':
          return (b.startingPrice || 0) - (a.startingPrice || 0);
        default:
          return 0; // No sorting, maintain original order
      }
    });

  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSortOption('default');
    setIsSearching(false);
  };

  // Map is always visible

  return (
    <div className="campgrounds-page">
      {/* Remove the campgrounds-header section */}
      <div className="campgrounds-search-container">
        <div className="search-section-header">
          <h3>{t('campgroundsPage.title')}</h3>
          <p>{t('campgroundsPage.subtitle')}</p>
        </div>

        <div className="campgrounds-search-form">
          <div className="search-input-group">
            <SearchAutocomplete
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={(term) => {
                setSearchTerm(term);
                setIsSearching(true);
              }}
              placeholder={t('campgroundsPage.searchPlaceholder')}
              className="enhanced-search-input"
            />
          </div>

          <div className="search-buttons">
            {isSearching && (
              <button type="button" className="clear-search-button" onClick={handleClearSearch}>
                {t('campgroundsPage.clearFilters')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content with Map and List Side by Side */}
      <div className="campgrounds-main-content">
        {/* Map Section */}
        <div className="map-section">
          {isLoading ? (
            <div className="map-loading">{t('campgroundsPage.loadingMap')}</div>
          ) : isError ? (
            <div className="map-error">
              {t('campgroundsPage.errorLoadingMap')}{' '}
              {error?.message || t('campgroundsPage.failedToLoadMap')}
            </div>
          ) : filteredAndSortedCampgrounds.length === 0 ? (
            <div className="map-empty">{t('campgroundsPage.noCampgroundsFound')}</div>
          ) : (
            <div className="map-container">
              <ClusterMap campgrounds={filteredAndSortedCampgrounds} />
            </div>
          )}
        </div>

        {/* Campground List Section */}
        <div className="campgrounds-content">
          {/* Sort Options */}
          <div className="sort-container">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="sort-select"
              disabled={isLoading}
            >
              <option value="default">{t('campgroundsPage.sortBy.default')}</option>
              <option value="price-low-high">{t('campgroundsPage.sortBy.priceLowHigh')}</option>
              <option value="price-high-low">{t('campgroundsPage.sortBy.priceHighLow')}</option>
            </select>
          </div>

          <CampgroundList
            searchTerm={searchTerm}
            sortOption={sortOption}
            campgrounds={filteredAndSortedCampgrounds}
          />
        </div>
      </div>
    </div>
  );
};

export default CampgroundsPage;
