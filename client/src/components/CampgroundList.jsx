import { useState, useEffect } from 'react';
import CampgroundCard from './CampgroundCard';
import ClusterMap from './maps/ClusterMap';
import useCampgrounds from '../hooks/useCampgrounds';
import apiClient from '../utils/api';
import './CampgroundList.css';

/**
 * CampgroundList component displays a grid of campground cards
 * with filtering capabilities
 *
 * @param {Object} props - Component props
 * @param {string} props.searchTerm - Search term for filtering campgrounds
 * @param {string} props.locationFilter - Location filter for filtering campgrounds
 * @param {boolean} props.hideMapView - Whether to hide the map view option (default: false)
 */
const CampgroundList = ({ searchTerm = '', locationFilter = '', hideMapView = false }) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', or 'map'

  // Use the custom hook to fetch all campgrounds
  const { useAllCampgrounds } = useCampgrounds();
  const { data, isLoading, isError, error, refetch } = useAllCampgrounds({
    // Enable refetching when search term changes
    enabled: true,
  });

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

  // Toggle between grid and list view
  const toggleViewMode = () => {
    setViewMode((prevMode) => (prevMode === 'grid' ? 'list' : 'grid'));
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="loading-message">
        <div className="spinner"></div>
        <p>Loading campgrounds...</p>
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <div className="error-message">
        <h3>Error loading campgrounds</h3>
        <p>{error?.message || 'Failed to load campgrounds. Please try again later.'}</p>
        <button onClick={() => refetch()} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  // Handle empty state
  if (filteredCampgrounds.length === 0) {
    return (
      <div className="no-results">
        <h3>No campgrounds found</h3>
        <p>Try adjusting your search criteria or explore all campgrounds.</p>
      </div>
    );
  }

  return (
    <div className="campground-list-container">
      <div className="campground-list-header">
        <div className="results-count">
          Found {filteredCampgrounds.length} campground{filteredCampgrounds.length !== 1 ? 's' : ''}
        </div>

        <div className="view-toggle">
          <button
            className={`view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            Grid
          </button>
          <button
            className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            List
          </button>
          {!hideMapView && (
            <button
              className={`view-toggle-button ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
              aria-label="Map view"
            >
              Map
            </button>
          )}
        </div>
      </div>

      {viewMode === 'map' ? (
        <ClusterMap campgrounds={filteredCampgrounds} />
      ) : (
        <div className={`campground-list ${viewMode}`}>
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
