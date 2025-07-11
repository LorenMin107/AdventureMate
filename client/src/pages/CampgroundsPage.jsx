import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CampgroundList from '../components/CampgroundList';
import ClusterMap from '../components/maps/ClusterMap';
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
      <div className="campgrounds-header">
        <h1>All Campgrounds</h1>
        <p>Discover and explore campgrounds in Myanmar</p>

        {currentUser && currentUser.isAdmin && (
          <Link to="/campgrounds/new" className="new-campground-button">
            Add New Campground
          </Link>
        )}
      </div>

      <div className="campgrounds-search-container">
        <form onSubmit={handleSearch} className="campgrounds-search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search campgrounds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="search-input-group">
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

          <div className="search-buttons">
            <button type="submit" className="search-button">
              Search
            </button>

            {isSearching && (
              <button type="button" className="clear-search-button" onClick={handleClearSearch}>
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

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
        <CampgroundList
          searchTerm={isSearching ? searchTerm : ''}
          locationFilter={isSearching ? locationFilter : ''}
          hideMapView={true} // Hide map view in list since we have a dedicated map section
        />
      </div>
    </div>
  );
};

export default CampgroundsPage;
