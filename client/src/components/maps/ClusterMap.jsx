import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Map, Marker, Popup, NavigationControl } from 'react-map-gl';
import { useTheme } from '../../context/ThemeContext';
import WeatherBox from '../WeatherBox';
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
  // Default view state centered on Thailand
  const defaultViewState = {
    longitude: 100.9925, // Thailand longitude
    latitude: 15.87, // Thailand latitude
    zoom: 5,
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
    (campground) =>
      campground.geometry &&
      campground.geometry.coordinates &&
      campground.geometry.coordinates.length === 2
  );

  // Force map re-render when theme changes
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (map) {
        // Update map style when theme changes
        const newMapStyle =
          theme === 'dark'
            ? 'mapbox://styles/mapbox/dark-v11'
            : 'mapbox://styles/mapbox/outdoors-v12';

        map.setStyle(newMapStyle);
      }
    }
  }, [theme]);

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
        key={`cluster-map-${theme}`}
        {...viewState}
        ref={mapRef}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={
          theme === 'dark'
            ? 'mapbox://styles/mapbox/dark-v11'
            : 'mapbox://styles/mapbox/outdoors-v12'
        }
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        onClick={handleMapClick}
        attributionControl={true}
        reuseMaps
      >
        <NavigationControl position="top-right" />

        {validCampgrounds.map((campground) => (
          <Marker
            key={campground._id}
            longitude={campground.geometry.coordinates[0]}
            latitude={campground.geometry.coordinates[1]}
            color="#F44336"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedCampground(campground);
              // Pan the map so the marker is visible with enough space for the popup
              const map = mapRef.current && mapRef.current.getMap ? mapRef.current.getMap() : null;
              if (map) {
                // Offset downward by 100px to make room for the popup below
                map.easeTo({
                  center: [campground.geometry.coordinates[0], campground.geometry.coordinates[1]],
                  offset: [0, 100],
                  duration: 800,
                  essential: true,
                });
              }
            }}
          />
        ))}

        {selectedCampground && (
          <Popup
            longitude={selectedCampground.geometry.coordinates[0]}
            latitude={selectedCampground.geometry.coordinates[1]}
            anchor="bottom"
            onClose={() => setSelectedCampground(null)}
            closeButton={false}
            closeOnClick={false}
            className="campground-popup"
          >
            <div className="popup-content">
              <div className="popup-header">
                <h3>{selectedCampground.title}</h3>
                <button
                  className="popup-close-button"
                  onClick={() => setSelectedCampground(null)}
                  aria-label="Close popup"
                >
                  ×
                </button>
              </div>

              <WeatherBox
                coordinates={{
                  lat: selectedCampground.geometry.coordinates[1],
                  lng: selectedCampground.geometry.coordinates[0],
                }}
                showForecast={true}
                compact={true}
              />

              <div className="popup-info">
                <p>{selectedCampground.location}</p>
                {selectedCampground.campsites && selectedCampground.campsites.length > 0 ? (
                  <p className="popup-price">
                    From ${Math.min(...selectedCampground.campsites.map((cs) => cs.price || 0))}/
                    night
                  </p>
                ) : (
                  <p className="popup-no-campsites">No campsites available yet.</p>
                )}
                <Link to={`/campgrounds/${selectedCampground._id}`} className="popup-view-button">
                  View Campground
                </Link>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default ClusterMap;
