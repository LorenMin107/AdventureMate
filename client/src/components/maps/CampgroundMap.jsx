import { useEffect, useState, useRef } from 'react';
import { Map, Marker, NavigationControl, Popup } from 'react-map-gl';
import { useTheme } from '../../context/ThemeContext';
import { logError, logInfo } from '../../utils/logger';
import 'mapbox-gl/dist/mapbox-gl.css';
import './CampgroundMap.css';

/**
 * CampgroundMap component displays a map with a marker for a single campground
 *
 * @param {Object} props - Component props
 * @param {Object} props.geometry - Campground geometry object with coordinates
 * @param {string} props.title - Campground title
 * @param {string} props.popupContent - HTML content for the popup (optional)
 * @param {number} props.zoom - Initial zoom level (default: 10)
 */
const CampgroundMap = ({ geometry, title, popupContent, zoom = 10 }) => {
  const { theme } = useTheme();
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState({
    longitude: geometry?.coordinates[0] || 0,
    latitude: geometry?.coordinates[1] || 0,
    zoom: zoom,
  });

  const [showPopup, setShowPopup] = useState(false);
  const [renderMap, setRenderMap] = useState(false); // Control when to render the map

  // Update viewState when geometry changes
  useEffect(() => {
    if (geometry && geometry.coordinates) {
      setViewState((prev) => ({
        ...prev,
        longitude: geometry.coordinates[0],
        latitude: geometry.coordinates[1],
      }));

      // Also resize the map when geometry changes
      if (mapRef.current) {
        const map = mapRef.current.getMap();
        // Short delay to allow state update to complete
        const geometryChangeTimer = setTimeout(() => {
          map.resize();
        }, 100);

        return () => clearTimeout(geometryChangeTimer);
      }
    }
  }, [geometry]);

  // Trigger map resize after component mounts and container is properly sized
  useEffect(() => {
    if (mapRef.current) {
      // Get the map instance
      const map = mapRef.current.getMap();

      // Resize after a short delay to ensure container is properly sized
      const resizeTimer = setTimeout(() => {
        map.resize();
      }, 300);

      // Additional resize after a longer delay to catch any layout shifts
      const secondResizeTimer = setTimeout(() => {
        map.resize();
      }, 1000);

      // Third resize with an even longer delay to catch very late layout shifts
      const thirdResizeTimer = setTimeout(() => {
        map.resize();
      }, 2000);

      // Handle window resize events to ensure map is properly sized
      const handleResize = () => {
        if (map) {
          map.resize();
        }
      };

      // Add event listener for window resize
      window.addEventListener('resize', handleResize);

      // Add a ResizeObserver to monitor container size changes directly
      let resizeObserver;
      try {
        resizeObserver = new ResizeObserver((entries) => {
          // When container size changes, resize the map
          if (map) {
            map.resize();
          }
        });

        // Start observing the map container
        const container = mapRef.current.getContainer();
        if (container) {
          resizeObserver.observe(container);
        }

        // Also observe the parent element for more reliable size detection
        if (container.parentElement) {
          resizeObserver.observe(container.parentElement);
        }
      } catch (e) {
        logError('ResizeObserver not supported, falling back to MutationObserver', e);

        // Fallback to MutationObserver if ResizeObserver is not supported
        const mutationObserver = new MutationObserver(() => {
          if (map) {
            map.resize();
          }
        });

        // Observe the parent element for changes
        const parentElement = mapRef.current.getContainer().parentElement;
        if (parentElement) {
          mutationObserver.observe(parentElement, {
            attributes: true,
            childList: true,
            subtree: true,
          });
        }
      }

      // Force a style recalculation to ensure the map container is properly sized
      // This helps with the background issue when navigating between pages
      const forceStyleRecalculation = () => {
        if (mapRef.current) {
          const container = mapRef.current.getContainer();
          // Force a reflow by accessing offsetHeight
          const height = container.offsetHeight;
          const width = container.offsetWidth;

          // Log dimensions for debugging
          logInfo('Map container dimensions', `${width}x${height}`);

          // Apply a small style change and revert it to trigger a repaint
          container.style.opacity = '0.99';
          setTimeout(() => {
            container.style.opacity = '1';
            map.resize();
          }, 0);
        }
      };

      // Call the force style recalculation after a delay
      const styleRecalcTimer = setTimeout(forceStyleRecalculation, 500);

      // Clean up the timeouts, event listener, and observers on component unmount
      return () => {
        clearTimeout(resizeTimer);
        clearTimeout(secondResizeTimer);
        clearTimeout(thirdResizeTimer);
        clearTimeout(styleRecalcTimer);
        window.removeEventListener('resize', handleResize);

        // Disconnect observers
        if (resizeObserver) {
          resizeObserver.disconnect();
        }

        // Ensure the map is properly cleaned up when unmounting
        if (mapRef.current) {
          try {
            // Remove the map container from the DOM to prevent background issues
            const container = mapRef.current.getContainer();
            if (container && container.parentNode) {
              // Set the container to invisible before removing to prevent flicker
              container.style.visibility = 'hidden';
              container.style.height = '0';
              // Force a resize to update the layout
              map.resize();
            }
          } catch (e) {
            logError('Error cleaning up map', e);
          }
        }
      };
    }
  }, []);

  // Resize map when theme changes as this can affect layout
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      // Short delay to allow theme change to complete
      const themeChangeTimer = setTimeout(() => {
        map.resize();
      }, 100);

      return () => clearTimeout(themeChangeTimer);
    }
  }, [theme]);

  // Delay rendering the map to ensure container is properly sized
  useEffect(() => {
    // First, ensure the container is visible and has dimensions
    if (document.querySelector('.campground-map-container')) {
      const container = document.querySelector('.campground-map-container');
      container.style.display = 'flex';
      container.style.visibility = 'visible';

      // Force a reflow to ensure the container has dimensions
      const height = container.offsetHeight;
      const width = container.offsetWidth;

      // Only render the map if the container has dimensions
      if (height > 0 && width > 0) {
        // Set a timeout to render the map after a delay
        const renderTimer = setTimeout(() => {
          setRenderMap(true);
        }, 100); // Reduced delay to 100ms since we've already checked dimensions

        return () => clearTimeout(renderTimer);
      } else {
        // If container doesn't have dimensions yet, try again after a delay
        const retryTimer = setTimeout(() => {
          setRenderMap(true);
        }, 500);

        return () => clearTimeout(retryTimer);
      }
    } else {
      // If container doesn't exist yet, use the original delay
      const renderTimer = setTimeout(() => {
        setRenderMap(true);
      }, 500);

      return () => clearTimeout(renderTimer);
    }
  }, []);

  // This effect specifically addresses the issue where the map size is incorrect
  // when navigating from the campgrounds page to the campground detail page
  useEffect(() => {
    // Only run this effect if the map is rendered
    if (renderMap && mapRef.current) {
      const map = mapRef.current.getMap();

      // Create an array of timeouts at different intervals
      // This ensures we catch any layout shifts that might happen at different times
      const timeouts = [100, 300, 600, 1000, 1500, 2000, 3000].map((delay) =>
        setTimeout(() => {
          if (mapRef.current) {
            map.resize();
            // Force a style recalculation after resize
            const container = mapRef.current.getContainer();
            if (container) {
              // Force a reflow
              const height = container.offsetHeight;
              // Apply a small style change and revert it to trigger a repaint
              container.style.opacity = '0.99';
              setTimeout(() => {
                container.style.opacity = '1';
              }, 0);
            }
          }
        }, delay)
      );

      // Clean up all timeouts
      return () => {
        timeouts.forEach((timeout) => clearTimeout(timeout));
      };
    }
  }, [renderMap]);

  // Resize the map after it's rendered
  useEffect(() => {
    if (renderMap && mapRef.current) {
      const map = mapRef.current.getMap();

      // Resize immediately after render
      map.resize();

      // Resize again after a short delay to ensure proper sizing
      const postRenderTimer = setTimeout(() => {
        map.resize();
      }, 100);

      return () => clearTimeout(postRenderTimer);
    }
  }, [renderMap]);

  // If no geometry is provided, don't render the map
  if (!geometry || !geometry.coordinates) {
    return (
      <div className="map-placeholder">
        <p>No location data available</p>
      </div>
    );
  }

  // Handle map container visibility and initialization
  useEffect(() => {
    // This effect runs once when the component is mounted
    // It ensures the map container is properly visible and initialized

    // Create a container reference that will be used throughout this effect
    let containerRef = null;

    // Function to initialize the map container
    const initializeMapContainer = () => {
      // Find the map container
      containerRef = document.querySelector('.campground-map-container');
      if (containerRef) {
        // Set initial opacity to 0
        containerRef.style.opacity = '0';

        // After a short delay, set opacity to 1 to fade in the map
        setTimeout(() => {
          containerRef.style.opacity = '1';

          // Force a resize after the fade in to ensure the map is properly sized
          if (mapRef.current) {
            const map = mapRef.current.getMap();
            map.resize();
          }
        }, 50);
      }
    };

    // Initialize the map container
    initializeMapContainer();

    // Set up a MutationObserver to detect when the map container is added to the DOM
    // This helps when the component is mounted but the container isn't immediately available
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if the map container has been added
          if (!containerRef && document.querySelector('.campground-map-container')) {
            initializeMapContainer();
          }
        }
      }
    });

    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });

    // Cleanup function that runs when the component is unmounted
    return () => {
      // Disconnect the observer
      observer.disconnect();

      // Find the map container
      containerRef = document.querySelector('.campground-map-container');
      if (containerRef) {
        // Set opacity to 0 to fade out the map
        containerRef.style.opacity = '0';

        // After the fade out, remove any background elements that might be left behind
        setTimeout(() => {
          if (containerRef.parentNode) {
            // Force a style recalculation on the parent to ensure it's properly updated
            const parent = containerRef.parentNode;
            parent.style.opacity = '0.99';
            setTimeout(() => {
              parent.style.opacity = '1';
            }, 0);
          }
        }, 300);
      }
    };
  }, []);

  // Using !important in CSS to ensure consistent map container sizing
  // This fixes issues where the map container sometimes takes up unnecessary space
  // Additional CSS properties like margin-bottom: 0 and box-sizing: border-box
  // help prevent weird spacing when viewing from the campgrounds page
  //
  // Multiple resize triggers have been added to ensure the map displays correctly:
  // 1. After component mount with a delay to ensure container is properly sized
  // 2. A second resize with a longer delay to catch any layout shifts
  // 3. On window resize to handle layout changes
  // 4. Using MutationObserver to detect DOM changes that might affect the map container
  // 5. On theme change which can affect the layout
  // 6. On geometry change which can affect the map's display
  // 7. Added fade in/out effect to ensure smooth transitions between pages
  // 8. Added multiple resize triggers at different intervals after the map is rendered
  //    to address the specific issue where the map size is incorrect when navigating
  //    from the campgrounds page to the campground detail page
  //
  // This comprehensive approach helps ensure the map displays correctly when navigating
  // between pages without requiring a page refresh. The multiple resize triggers at
  // different intervals (100ms, 300ms, 600ms, 1000ms, 1500ms, 2000ms, 3000ms) provide
  // a more robust solution than a single resize, as they catch any layout shifts that
  // might happen at different times after the component is mounted.
  return (
    <div className="campground-map-container">
      {!renderMap && (
        <div className="map-loading-placeholder">
          <p>Preparing map...</p>
        </div>
      )}

      {renderMap && (
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle={
            theme === 'dark'
              ? 'mapbox://styles/mapbox/dark-v11'
              : 'mapbox://styles/mapbox/outdoors-v12'
          }
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          attributionControl={true}
          reuseMaps
        >
          <NavigationControl position="top-right" />

          <Marker
            longitude={geometry.coordinates[0]}
            latitude={geometry.coordinates[1]}
            color="#F44336"
            onClick={() => setShowPopup(true)}
          />

          {showPopup && (
            <Popup
              longitude={geometry.coordinates[0]}
              latitude={geometry.coordinates[1]}
              anchor="bottom"
              onClose={() => setShowPopup(false)}
              closeButton={true}
              closeOnClick={false}
              className="campground-popup"
            >
              <div>
                {popupContent ? (
                  <div dangerouslySetInnerHTML={{ __html: popupContent }} />
                ) : (
                  <h3>{title}</h3>
                )}
              </div>
            </Popup>
          )}
        </Map>
      )}
    </div>
  );
};

export default CampgroundMap;
