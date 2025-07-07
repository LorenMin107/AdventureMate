const redisCache = require('../utils/redis');
const { logInfo, logDebug } = require('../utils/logger');

/**
 * Cache middleware for API responses
 * @param {string} type - Cache type (campgrounds, users, bookings, etc.)
 * @param {string} keyPrefix - Prefix for cache keys
 * @param {number} ttl - Time to live in seconds (optional, uses default if not provided)
 */
const cacheMiddleware = (type, keyPrefix, ttl = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if Redis is not available
    if (!redisCache.isReady()) {
      return next();
    }

    // Generate cache key based on request
    const cacheKey = generateCacheKey(keyPrefix, req);

    try {
      // Try to get from cache
      const cachedData = await redisCache.get(cacheKey);

      if (cachedData) {
        logDebug('Cache hit - serving from cache', {
          key: cacheKey,
          type,
          url: req.originalUrl,
        });

        // Add cache headers
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);

        return res.json(cachedData);
      }

      // Cache miss - intercept the response
      logDebug('Cache miss - fetching from database', {
        key: cacheKey,
        type,
        url: req.originalUrl,
      });

      // Store original send method
      const originalSend = res.json;

      // Override res.json to cache the response
      res.json = function (data) {
        // Restore original method
        res.json = originalSend;

        // Cache the response
        const cacheTTL = ttl || redisCache.config?.ttl?.[type] || 300;
        redisCache
          .setWithDefaultTTL(cacheKey, data, type)
          .then(() => {
            logDebug('Response cached successfully', {
              key: cacheKey,
              ttl: cacheTTL,
              type,
            });
          })
          .catch((error) => {
            logDebug('Failed to cache response', {
              key: cacheKey,
              error: error.message,
              type,
            });
          });

        // Add cache headers
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);

        // Send the response
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logDebug('Cache middleware error, proceeding without cache', {
        key: cacheKey,
        error: error.message,
        type,
      });
      next();
    }
  };
};

/**
 * Generate cache key based on request parameters
 * @param {string} prefix - Key prefix
 * @param {Object} req - Express request object
 * @returns {string} Cache key
 */
const generateCacheKey = (prefix, req) => {
  const parts = [prefix];

  // Add user ID if authenticated
  if (req.user && req.user._id) {
    parts.push(`user:${req.user._id}`);
  }

  // Add query parameters (sorted for consistency)
  const queryKeys = Object.keys(req.query).sort();
  if (queryKeys.length > 0) {
    const queryString = queryKeys.map((key) => `${key}:${req.query[key]}`).join('|');
    parts.push(`query:${queryString}`);
  }

  // Add URL parameters
  if (req.params && Object.keys(req.params).length > 0) {
    const paramString = Object.keys(req.params)
      .map((key) => `${key}:${req.params[key]}`)
      .join('|');
    parts.push(`params:${paramString}`);
  }

  return parts.join(':');
};

/**
 * Cache invalidation middleware
 * @param {string} pattern - Redis pattern to match keys for invalidation
 */
const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    try {
      await redisCache.invalidatePattern(pattern);
      logInfo('Cache invalidated', { pattern });
    } catch (error) {
      logDebug('Cache invalidation failed', { pattern, error: error.message });
    }
    next();
  };
};

/**
 * Cache warming middleware for frequently accessed data
 * @param {Function} dataFetcher - Function to fetch data
 * @param {string} cacheKey - Cache key
 * @param {string} type - Cache type
 */
const warmCache = (dataFetcher, cacheKey, type) => {
  return async (req, res, next) => {
    try {
      // Check if data is already cached
      const cachedData = await redisCache.get(cacheKey);

      if (!cachedData) {
        // Fetch and cache the data
        const data = await dataFetcher();
        await redisCache.setWithDefaultTTL(cacheKey, data, type);
        logInfo('Cache warmed', { key: cacheKey, type });
      }
    } catch (error) {
      logDebug('Cache warming failed', { key: cacheKey, error: error.message });
    }
    next();
  };
};

/**
 * Conditional cache middleware - only cache if conditions are met
 * @param {Function} condition - Function that returns true if should cache
 * @param {string} type - Cache type
 * @param {string} keyPrefix - Cache key prefix
 */
const conditionalCache = (condition, type, keyPrefix) => {
  return async (req, res, next) => {
    if (!condition(req)) {
      return next();
    }

    return cacheMiddleware(type, keyPrefix)(req, res, next);
  };
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  warmCache,
  conditionalCache,
  generateCacheKey,
};
