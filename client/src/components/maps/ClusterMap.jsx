import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Map, Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import { useTheme } from '../../context/ThemeContext';
import 'mapbox-gl/dist/mapbox-gl.css';
import './ClusterMap.css';

/**
 * ClusterMap component displays all campgrounds on a map with markers
 * 
 * @param {Object} props - Component props
 * @param {Array} props.campgrounds - Array of campground objects
 * @param {Object} props.initialViewState - Initial view state for the map (optional)
 */
const ClusterMap = ({ campgrounds = [], initialViewState }) => {
  const { theme } = useTheme();
  // Default view state centered on Myanmar
  const defaultViewState = {
    longitude: 96.1951,
    latitude: 19.7633,
    zoom: 5
  };

  const [viewState, setViewState] = useState(initialViewState || defaultViewState);
  const [selectedCampground, setSelectedCampground] = useState(null);
  const mapRef = useRef(null);

  // Close popup when clicking elsewhere on the map
  const handleMapClick = () => {
    setSelectedCampground(null);
  };

  // Filter out campgrounds without valid geometry
  const validCampgrounds = campgrounds.filter(
    campground => campground.geometry && 
    campground.geometry.coordinates && 
    campground.geometry.coordinates.length === 2
  );

  // If no campgrounds with valid geometry, show a message
  if (validCampgrounds.length === 0) {
    return (
      <div className="cluster-map-placeholder">
        <p>No campgrounds with location data available</p>
      </div>
    );
  }

  // Force a specific size for the map container to ensure consistency
  return (
    <div className="cluster-map-container">
      <Map
        {...viewState}
        ref={mapRef}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={theme === 'dark' 
          ? "mapbox://styles/mapbox/dark-v11" 
          : "mapbox://styles/mapbox/outdoors-v12"}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        onClick={handleMapClick}
        attributionControl={true}
        reuseMaps
      >
        <NavigationControl position="top-right" />

        {validCampgrounds.map(campground => (
          <Marker
            key={campground._id}
            longitude={campground.geometry.coordinates[0]}
            latitude={campground.geometry.coordinates[1]}
            color="#F44336"
            onClick={e => {
              e.originalEvent.stopPropagation();
              setSelectedCampground(campground);
            }}
          />
        ))}

        {selectedCampground && (
          <Popup
            longitude={selectedCampground.geometry.coordinates[0]}
            latitude={selectedCampground.geometry.coordinates[1]}
            anchor="bottom"
            onClose={() => setSelectedCampground(null)}
            closeButton={true}
            closeOnClick={false}
            className="campground-popup"
          >
            <div className="popup-content">
              <h3>{selectedCampground.title}</h3>
              <p>{selectedCampground.location}</p>
              <p className="popup-price">${selectedCampground.price}/night</p>
              <Link 
                to={`/campgrounds/${selectedCampground._id}`}
                className="popup-view-button"
              >
                View Campground
              </Link>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default ClusterMap;
