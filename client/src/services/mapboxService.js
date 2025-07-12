import api from '../utils/api';

/**
 * Frontend service for Mapbox operations using cached backend endpoints
 */
class MapboxService {
  /**
   * Geocode an address using cached backend
   * @param {string} address - Address to geocode
   * @param {Object} options - Geocoding options
   * @returns {Promise<Object>} Geocoding result
   */
  static async geocode(address, options = {}) {
    try {
      const response = await api.get('/api/v1/mapbox/geocode', {
        params: { address, ...options },
      });
      return response.data;
    } catch (error) {
      console.error('Geocoding failed:', error);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates using cached backend
   * @param {number} lng - Longitude
   * @param {number} lat - Latitude
   * @param {Object} options - Reverse geocoding options
   * @returns {Promise<Object>} Reverse geocoding result
   */
  static async reverseGeocode(lng, lat, options = {}) {
    try {
      const response = await api.get('/api/v1/mapbox/reverse-geocode', {
        params: { lng, lat, ...options },
      });
      return response.data;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions using cached backend
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search suggestions
   */
  static async getSuggestions(query, options = {}) {
    try {
      const response = await api.get('/api/v1/mapbox/suggestions', {
        params: { query, ...options },
      });
      return response.data;
    } catch (error) {
      console.error('Search suggestions failed:', error);
      throw error;
    }
  }

  /**
   * Extract address components from Mapbox feature
   * @param {Object} feature - Mapbox feature
   * @returns {Object} Address components
   */
  static extractAddressComponents(feature) {
    const components = feature.context || [];
    let street = '',
      city = '',
      state = '',
      country = '';

    for (const comp of components) {
      if (comp.id.startsWith('place')) city = comp.text;
      if (comp.id.startsWith('region')) state = comp.text;
      if (comp.id.startsWith('country')) country = comp.text;
      if (comp.id.startsWith('address')) street = comp.text;
    }

    // Sometimes street is in feature.text
    if (!street && feature.place_type && feature.place_type.includes('address')) {
      street = feature.text;
    }

    return { street, city, state, country };
  }
}

export default MapboxService;
