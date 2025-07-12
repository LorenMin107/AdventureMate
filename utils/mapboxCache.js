const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const config = require('../config');
const redisCache = require('./redis');
const { logInfo, logError, logWarn, logDebug } = require('./logger');

/**
 * Mapbox API Cache Service
 * Provides cached access to Mapbox geocoding services
 */
class MapboxCache {
  constructor() {
    this.geocoder = mbxGeocoding({ accessToken: config.mapbox.token });
    this.cachePrefix = 'mapbox:';
  }

  /**
   * Geocode an address with caching
   * @param {string} address - Address to geocode
   * @param {Object} options - Geocoding options
   * @returns {Object} Geocoding result
   */
  async geocode(address, options = {}) {
    const cacheKey = `${this.cachePrefix}geocode:${this.hashString(address)}`;

    // Try cache first
    if (redisCache.isReady()) {
      const cached = await redisCache.get(cacheKey);
      if (cached) {
        logDebug('Mapbox geocoding cache hit', { address });
        return cached;
      }
    }

    try {
      // Call Mapbox API
      const response = await this.geocoder
        .forwardGeocode({
          query: address,
          limit: options.limit || 1,
          ...options,
        })
        .send();

      const result = {
        features: response.body.features,
        query: address,
        timestamp: new Date().toISOString(),
      };

      // Cache for 24 hours (geocoding results rarely change)
      if (redisCache.isReady()) {
        await redisCache.set(cacheKey, result, 86400);
        logDebug('Mapbox geocoding cached', { address });
      }

      logInfo('Mapbox geocoding successful', { address, results: result.features.length });
      return result;
    } catch (error) {
      logError('Mapbox geocoding failed', error, { address });
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates with caching
   * @param {number} lng - Longitude
   * @param {number} lat - Latitude
   * @param {Object} options - Reverse geocoding options
   * @returns {Object} Reverse geocoding result
   */
  async reverseGeocode(lng, lat, options = {}) {
    const cacheKey = `${this.cachePrefix}reverse:${lng.toFixed(6)}:${lat.toFixed(6)}`;

    // Try cache first
    if (redisCache.isReady()) {
      const cached = await redisCache.get(cacheKey);
      if (cached) {
        logDebug('Mapbox reverse geocoding cache hit', { lng, lat });
        return cached;
      }
    }

    try {
      // Call Mapbox API
      const response = await this.geocoder
        .reverseGeocode({
          query: [lng, lat],
          limit: options.limit || 1,
          ...options,
        })
        .send();

      const result = {
        features: response.body.features,
        coordinates: { lng, lat },
        timestamp: new Date().toISOString(),
      };

      // Cache for 24 hours
      if (redisCache.isReady()) {
        await redisCache.set(cacheKey, result, 86400);
        logDebug('Mapbox reverse geocoding cached', { lng, lat });
      }

      logInfo('Mapbox reverse geocoding successful', { lng, lat, results: result.features.length });
      return result;
    } catch (error) {
      logError('Mapbox reverse geocoding failed', error, { lng, lat });
      throw error;
    }
  }

  /**
   * Get search suggestions with caching
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Object} Search suggestions
   */
  async getSuggestions(query, options = {}) {
    const cacheKey = `${this.cachePrefix}suggestions:${this.hashString(query)}`;

    // Try cache first
    if (redisCache.isReady()) {
      const cached = await redisCache.get(cacheKey);
      if (cached) {
        logDebug('Mapbox suggestions cache hit', { query });
        return cached;
      }
    }

    try {
      // Call Mapbox API
      const response = await this.geocoder
        .forwardGeocode({
          query,
          limit: options.limit || 5,
          types: options.types || ['place', 'address'],
          ...options,
        })
        .send();

      const result = {
        suggestions: response.body.features.map((feature) => ({
          text: feature.text,
          place_name: feature.place_name,
          center: feature.center,
          bbox: feature.bbox,
          properties: feature.properties,
        })),
        query,
        timestamp: new Date().toISOString(),
      };

      // Cache for 1 hour (suggestions change more frequently)
      if (redisCache.isReady()) {
        await redisCache.set(cacheKey, result, 3600);
        logDebug('Mapbox suggestions cached', { query });
      }

      logInfo('Mapbox suggestions successful', { query, suggestions: result.suggestions.length });
      return result;
    } catch (error) {
      logError('Mapbox suggestions failed', error, { query });
      throw error;
    }
  }

  /**
   * Extract address components from Mapbox feature
   * @param {Object} feature - Mapbox feature
   * @returns {Object} Address components
   */
  extractAddressComponents(feature) {
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
    if (!street && feature.place_type.includes('address')) {
      street = feature.text;
    }

    return { street, city, state, country };
  }

  /**
   * Invalidate cache for specific patterns
   * @param {string} pattern - Cache pattern to invalidate
   */
  async invalidateCache(pattern = 'mapbox:*') {
    if (redisCache.isReady()) {
      await redisCache.invalidatePattern(pattern);
      logInfo('Mapbox cache invalidated', { pattern });
    }
  }

  /**
   * Get cache statistics for Mapbox
   */
  async getCacheStats() {
    if (!redisCache.isReady()) {
      return { connected: false };
    }

    try {
      const keys = await redisCache.client.keys('mapbox:*');
      const stats = {
        connected: true,
        totalKeys: keys.length,
        geocodingKeys: keys.filter((k) => k.includes('geocode:')).length,
        reverseKeys: keys.filter((k) => k.includes('reverse:')).length,
        suggestionKeys: keys.filter((k) => k.includes('suggestions:')).length,
      };

      return stats;
    } catch (error) {
      logError('Error getting Mapbox cache stats', error);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Simple string hash for cache keys
   * @param {string} str - String to hash
   * @returns {string} Hash
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

module.exports = new MapboxCache();
