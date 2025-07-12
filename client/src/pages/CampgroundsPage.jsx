import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
          <h3>Find Your Perfect Campground</h3>
          <p>Search by name, description, or location, then filter by specific areas</p>
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
              placeholder="Search campgrounds..."
              className="enhanced-search-input"
            />
          </div>

          <div className="search-buttons">
            {isSearching && (
              <button type="button" className="clear-search-button" onClick={handleClearSearch}>
                Clear Filters
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
            <div className="map-loading">Loading map...</div>
          ) : isError ? (
            <div className="map-error">
              Error loading map: {error?.message || 'Failed to load map data'}
            </div>
          ) : filteredCampgrounds.length === 0 ? (
            <div className="map-empty">No campgrounds match your search criteria</div>
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
              <option value="">All Locations</option>
              {isLoading ? (
                <option disabled>Loading locations...</option>
              ) : (
                locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))
              )}
            </select>
          </div>

          <CampgroundList
            searchTerm={isSearching ? searchTerm : ''}
            locationFilter={isSearching ? locationFilter : ''}
          />
        </div>
      </div>
    </div>
  );
};

export default CampgroundsPage;
