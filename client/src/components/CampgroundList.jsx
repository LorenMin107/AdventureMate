import { useState, useEffect } from 'react';
import CampgroundCard from './CampgroundCard';
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
 */
const CampgroundList = ({ searchTerm = '', locationFilter = '' }) => {
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

  // No view toggle needed - only grid view is supported

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
      </div>

      <div className="campground-list grid">
        {filteredCampgrounds.map((campground) => (
          <div className="campground-item" key={campground._id}>
            <CampgroundCard campground={campground} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampgroundList;
