const express = require('express');
const mapboxCache = require('../../../utils/mapboxCache');
const asyncHandler = require('../../../utils/catchAsync');
const ApiResponse = require('../../../utils/ApiResponse');
const { validationError } = require('../../../utils/errorHandler');
const { logInfo, logError } = require('../../../utils/logger');

const router = express.Router();

/**
 * Geocode an address
 * GET /api/v1/mapbox/geocode?address=...
 */
router.get(
  '/geocode',
  asyncHandler(async (req, res) => {
    const { address, limit = 1, ...options } = req.query;

    if (!address || !address.trim()) {
      throw validationError('Address parameter is required');
    }

    try {
      const result = await mapboxCache.geocode(address.trim(), {
        limit: parseInt(limit),
        ...options,
      });

      logInfo('Mapbox geocoding API call', {
        address: address.trim(),
        results: result.features.length,
        cached: true,
      });

      return ApiResponse.success(result, 'Geocoding successful').send(res);
    } catch (error) {
      logError('Mapbox geocoding API error', error, { address: address.trim() });
      throw error;
    }
  })
);

/**
 * Reverse geocode coordinates
 * GET /api/v1/mapbox/reverse-geocode?lng=...&lat=...
 */
router.get(
  '/reverse-geocode',
  asyncHandler(async (req, res) => {
    const { lng, lat, limit = 1, ...options } = req.query;

    if (!lng || !lat) {
      throw validationError('Longitude and latitude parameters are required');
    }

    const longitude = parseFloat(lng);
    const latitude = parseFloat(lat);

    if (isNaN(longitude) || isNaN(latitude)) {
      throw validationError('Invalid longitude or latitude values');
    }

    try {
      const result = await mapboxCache.reverseGeocode(longitude, latitude, {
        limit: parseInt(limit),
        ...options,
      });

      logInfo('Mapbox reverse geocoding API call', {
        coordinates: [longitude, latitude],
        results: result.features.length,
        cached: true,
      });

      return ApiResponse.success(result, 'Reverse geocoding successful').send(res);
    } catch (error) {
      logError('Mapbox reverse geocoding API error', error, {
        coordinates: [longitude, latitude],
      });
      throw error;
    }
  })
);

/**
 * Get search suggestions
 * GET /api/v1/mapbox/suggestions?query=...
 */
router.get(
  '/suggestions',
  asyncHandler(async (req, res) => {
    const { query, limit = 5, types, ...options } = req.query;

    if (!query || !query.trim()) {
      throw validationError('Query parameter is required');
    }

    try {
      const searchOptions = { limit: parseInt(limit), ...options };
      if (types) {
        searchOptions.types = types.split(',');
      }

      const result = await mapboxCache.getSuggestions(query.trim(), searchOptions);

      logInfo('Mapbox suggestions API call', {
        query: query.trim(),
        suggestions: result.suggestions.length,
        cached: true,
      });

      return ApiResponse.success(result, 'Search suggestions successful').send(res);
    } catch (error) {
      logError('Mapbox suggestions API error', error, { query: query.trim() });
      throw error;
    }
  })
);

/**
 * Get cache statistics
 * GET /api/v1/mapbox/cache-stats
 */
router.get(
  '/cache-stats',
  asyncHandler(async (req, res) => {
    try {
      const stats = await mapboxCache.getCacheStats();
      return ApiResponse.success(stats, 'Cache statistics retrieved').send(res);
    } catch (error) {
      logError('Mapbox cache stats API error', error);
      throw error;
    }
  })
);

/**
 * Invalidate cache
 * POST /api/v1/mapbox/invalidate-cache
 */
router.post(
  '/invalidate-cache',
  asyncHandler(async (req, res) => {
    const { pattern = 'mapbox:*' } = req.body;

    try {
      await mapboxCache.invalidateCache(pattern);

      logInfo('Mapbox cache invalidated via API', { pattern });

      return ApiResponse.success(
        { pattern, message: 'Cache invalidated successfully' },
        'Cache invalidated'
      ).send(res);
    } catch (error) {
      logError('Mapbox cache invalidation API error', error, { pattern });
      throw error;
    }
  })
);

module.exports = router;
