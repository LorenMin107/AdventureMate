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
  const [locationFilter, setLocationFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [locations, setLocations] = useState([]);

  // Use the custom hook to fetch campgrounds and locations
  const { useAllCampgrounds } = useCampgrounds();
  const { data, isLoading, isError, error } = useAllCampgrounds();

  // Extract locations and campgrounds from data when it's available
  useEffect(() => {
    if (data && data.locations) {
      setLocations(data.locations);
    }
  }, [data]);

  // Extract campgrounds from data
  const campgrounds = data?.campgrounds || [];

  // Filter campgrounds by search term and location
  const filteredCampgrounds = campgrounds.filter((campground) => {
    // Check if campground matches the search term
    const matchesSearchTerm =
      !searchTerm ||
      campground.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campground.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campground.location.toLowerCase().includes(searchTerm.toLowerCase());

    // Check if campground matches the location filter
    const matchesLocation =
      !locationFilter || campground.location.toLowerCase().includes(locationFilter.toLowerCase());

    // Return true if campground matches both filters
    return matchesSearchTerm && matchesLocation;
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setLocationFilter('');
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
          ) : filteredCampgrounds.length === 0 ? (
            <div className="map-empty">{t('campgroundsPage.noCampgroundsFound')}</div>
          ) : (
            <div className="map-container">
              <ClusterMap campgrounds={filteredCampgrounds} />
            </div>
          )}
        </div>

        {/* Campground List Section */}
        <div className="campgrounds-content">
          {/* Location Filter */}
          <div className="location-filter-container">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="location-filter"
              disabled={isLoading}
            >
              <option value="">{t('campgroundsPage.allLocations')}</option>
              {isLoading ? (
                <option disabled>{t('campgroundsPage.loadingLocations')}</option>
              ) : (
                locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))
              )}
            </select>
          </div>

          <CampgroundList searchTerm={searchTerm} locationFilter={locationFilter} />
        </div>
      </div>
    </div>
  );
};

export default CampgroundsPage;
