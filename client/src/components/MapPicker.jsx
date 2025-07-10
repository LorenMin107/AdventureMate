import React, { useState, useRef, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import PropTypes from 'prop-types';
import './MapPicker.css'; // Add a CSS file for custom styles

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN;

const defaultThailand = {
  latitude: 15.87,
  longitude: 100.9925,
  zoom: 5.5,
};

// Helper to extract address components from Mapbox feature
function extractAddressComponents(feature) {
  let street = '',
    city = '',
    state = '',
    country = '';
  if (feature && feature.context) {
    for (const c of feature.context) {
      if (c.id.startsWith('place')) city = c.text;
      if (c.id.startsWith('region')) state = c.text;
      if (c.id.startsWith('country')) country = c.text;
      if (c.id.startsWith('address')) street = c.text;
    }
  }
  // Sometimes street is in feature.text for address types
  if (feature && feature.place_type && feature.place_type[0] === 'address') {
    street = feature.text;
  }
  return { street, city, state, country };
}

const MapPicker = ({ value, onChange, initialAddress, style, theme = 'light' }) => {
  const [viewport, setViewport] = useState({
    latitude: value?.lat || defaultThailand.latitude,
    longitude: value?.lng || defaultThailand.longitude,
    zoom: value ? 12 : defaultThailand.zoom,
  });
  const [marker, setMarker] = useState(
    value?.lat && value?.lng ? { lat: value.lat, lng: value.lng } : null
  );
  const [address, setAddress] = useState(initialAddress || '');
  const mapRef = useRef();
  const geocoderRef = useRef();
  const geocoderContainerRef = useRef();

  // Add geocoder control on mount (dynamic import)
  useEffect(() => {
    let geocoder;
    let cleanup = () => {};
    if (!mapRef.current) return;

    import('@mapbox/mapbox-gl-geocoder').then(({ default: MapboxGeocoder }) => {
      geocoder = new MapboxGeocoder({
        accessToken: MAPBOX_TOKEN,
        mapboxgl,
        marker: false,
        placeholder: 'Search for a place',
        countries: 'TH',
        flyTo: { zoom: 12 },
        theme: theme === 'dark' ? 'dark' : 'light',
      });
      geocoderRef.current = geocoder;
      // Add to custom container instead of map controls
      if (geocoderContainerRef.current) {
        geocoderContainerRef.current.innerHTML = '';
        geocoderContainerRef.current.appendChild(geocoder.onAdd(mapRef.current.getMap()));
      }
      geocoder.on('result', (e) => {
        const coords = e.result.center;
        setMarker({ lat: coords[1], lng: coords[0] });
        setViewport((v) => ({ ...v, latitude: coords[1], longitude: coords[0], zoom: 12 }));
        setAddress(e.result.place_name);
        const components = extractAddressComponents(e.result);
        if (onChange)
          onChange({ lat: coords[1], lng: coords[0], address: e.result.place_name, components });
      });
      cleanup = () => {
        if (geocoderRef.current && geocoderRef.current.onRemove) {
          geocoderRef.current.onRemove();
          geocoderRef.current = null;
        }
      };
    });

    return () => {
      cleanup();
    };
    // eslint-disable-next-line
  }, [mapRef.current, theme]);

  // Handle map click to set marker and reverse geocode
  const handleMapClick = async (e) => {
    const { lngLat } = e;
    setMarker({ lat: lngLat.lat, lng: lngLat.lng });
    setViewport((v) => ({ ...v, latitude: lngLat.lat, longitude: lngLat.lng }));
    // Reverse geocode
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${MAPBOX_TOKEN}`;
      const resp = await fetch(url);
      const data = await resp.json();
      const feature = data.features && data.features[0];
      const place = feature?.place_name;
      setAddress(place || '');
      const components = extractAddressComponents(feature);
      if (onChange) onChange({ lat: lngLat.lat, lng: lngLat.lng, address: place, components });
    } catch {
      setAddress('');
      if (onChange) onChange({ lat: lngLat.lat, lng: lngLat.lng, address: '', components: {} });
    }
  };

  // Theme style
  const mapStyle =
    theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12';

  return (
    <div className="map-picker-container" style={style}>
      <div ref={geocoderContainerRef} className={`mapbox-geocoder-container ${theme}`}></div>
      <Map
        ref={mapRef}
        initialViewState={viewport}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle}
        style={{ width: '100%', height: 350, borderRadius: 12 }}
        onMove={(evt) => setViewport(evt.viewState)}
        onClick={handleMapClick}
      >
        {marker && (
          <Marker longitude={marker.lng} latitude={marker.lat} anchor="bottom">
            <div
              style={{
                background: 'transparent',
                borderRadius: '50%',
                width: 24,
                height: 24,
                border: '1px solid #fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#e53935', fontWeight: 700, fontSize: 20 }}>📍</span>
            </div>
          </Marker>
        )}
      </Map>
      <div className="map-picker-address" style={{ marginTop: 12, color: 'var(--color-text)' }}>
        <label style={{ fontWeight: 600 }}>Selected Address:</label>
        <div style={{ marginTop: 4 }}>{address || <em>No address selected</em>}</div>
      </div>
    </div>
  );
};

MapPicker.propTypes = {
  value: PropTypes.shape({ lat: PropTypes.number, lng: PropTypes.number }),
  onChange: PropTypes.func,
  initialAddress: PropTypes.string,
  style: PropTypes.object,
  theme: PropTypes.oneOf(['light', 'dark']),
};

export default MapPicker;
