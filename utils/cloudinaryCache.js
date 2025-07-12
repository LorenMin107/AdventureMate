const { cloudinary } = require('../cloudinary');
const redisCache = require('./redis');
const { logInfo, logError, logWarn, logDebug } = require('./logger');

/**
 * Cloudinary Cache Service
 * Provides cached access to Cloudinary image transformations and metadata
 */
class CloudinaryCache {
  constructor() {
    this.cachePrefix = 'cloudinary:';
  }

  /**
   * Generate optimized image URL with caching
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - Transformation options
   * @returns {string} Optimized image URL
   */
  async getOptimizedUrl(publicId, options = {}) {
    const cacheKey = `${this.cachePrefix}url:${this.hashString(publicId + JSON.stringify(options))}`;

    // Try cache first
    if (redisCache.isReady()) {
      const cached = await redisCache.get(cacheKey);
      if (cached) {
        logDebug('Cloudinary URL cache hit', { publicId });
        return cached.url;
      }
    }

    try {
      // Generate optimized URL
      const url = cloudinary.url(publicId, {
        quality: 'auto',
        fetch_format: 'auto',
        ...options,
      });

      const result = {
        url,
        publicId,
        options,
        timestamp: new Date().toISOString(),
      };

      // Cache for 1 hour (URLs can change with transformations)
      if (redisCache.isReady()) {
        await redisCache.set(cacheKey, result, 3600);
        logDebug('Cloudinary URL cached', { publicId });
      }

      logInfo('Cloudinary URL generated', { publicId, url });
      return url;
    } catch (error) {
      logError('Cloudinary URL generation failed', error, { publicId });
      throw error;
    }
  }

  /**
   * Get image metadata with caching
   * @param {string} publicId - Cloudinary public ID
   * @returns {Object} Image metadata
   */
  async getImageMetadata(publicId) {
    const cacheKey = `${this.cachePrefix}metadata:${this.hashString(publicId)}`;

    // Try cache first
    if (redisCache.isReady()) {
      const cached = await redisCache.get(cacheKey);
      if (cached) {
        logDebug('Cloudinary metadata cache hit', { publicId });
        return cached;
      }
    }

    try {
      // Get image info from Cloudinary
      const result = await cloudinary.api.resource(publicId, {
        fields: 'public_id,format,width,height,bytes,duration,created_at,url,secure_url',
      });

      const metadata = {
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
        duration: result.duration,
        createdAt: result.created_at,
        url: result.url,
        secureUrl: result.secure_url,
        timestamp: new Date().toISOString(),
      };

      // Cache for 24 hours (metadata rarely changes)
      if (redisCache.isReady()) {
        await redisCache.set(cacheKey, metadata, 86400);
        logDebug('Cloudinary metadata cached', { publicId });
      }

      logInfo('Cloudinary metadata retrieved', { publicId, format: metadata.format });
      return metadata;
    } catch (error) {
      logError('Cloudinary metadata retrieval failed', error, { publicId });
      throw error;
    }
  }

  /**
   * Get multiple image metadata with caching
   * @param {string[]} publicIds - Array of Cloudinary public IDs
   * @returns {Object[]} Array of image metadata
   */
  async getMultipleImageMetadata(publicIds) {
    const results = [];
    const uncachedIds = [];

    // Check cache for each image
    for (const publicId of publicIds) {
      const cacheKey = `${this.cachePrefix}metadata:${this.hashString(publicId)}`;

      if (redisCache.isReady()) {
        const cached = await redisCache.get(cacheKey);
        if (cached) {
          results.push(cached);
          logDebug('Cloudinary metadata cache hit', { publicId });
        } else {
          uncachedIds.push(publicId);
        }
      } else {
        uncachedIds.push(publicId);
      }
    }

    // Fetch uncached images
    if (uncachedIds.length > 0) {
      try {
        const resources = await cloudinary.api.resources_by_ids(uncachedIds, {
          fields: 'public_id,format,width,height,bytes,duration,created_at,url,secure_url',
        });

        for (const resource of resources) {
          const metadata = {
            publicId: resource.public_id,
            format: resource.format,
            width: resource.width,
            height: resource.height,
            size: resource.bytes,
            duration: resource.duration,
            createdAt: resource.created_at,
            url: resource.url,
            secureUrl: resource.secure_url,
            timestamp: new Date().toISOString(),
          };

          // Cache individual metadata
          const cacheKey = `${this.cachePrefix}metadata:${this.hashString(resource.public_id)}`;
          if (redisCache.isReady()) {
            await redisCache.set(cacheKey, metadata, 86400);
          }

          results.push(metadata);
        }

        logInfo('Cloudinary multiple metadata retrieved', {
          total: publicIds.length,
          cached: publicIds.length - uncachedIds.length,
          fetched: uncachedIds.length,
        });
      } catch (error) {
        logError('Cloudinary multiple metadata retrieval failed', error, {
          publicIds: uncachedIds,
        });
        throw error;
      }
    }

    return results;
  }

  /**
   * Generate thumbnail URL with caching
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - Thumbnail options
   * @returns {string} Thumbnail URL
   */
  async getThumbnailUrl(publicId, options = {}) {
    const defaultOptions = {
      width: 300,
      height: 200,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    };

    return this.getOptimizedUrl(publicId, { ...defaultOptions, ...options });
  }

  /**
   * Generate responsive image URLs with caching
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - Responsive options
   * @returns {Object} Responsive URLs
   */
  async getResponsiveUrls(publicId, options = {}) {
    const cacheKey = `${this.cachePrefix}responsive:${this.hashString(publicId + JSON.stringify(options))}`;

    // Try cache first
    if (redisCache.isReady()) {
      const cached = await redisCache.get(cacheKey);
      if (cached) {
        logDebug('Cloudinary responsive URLs cache hit', { publicId });
        return cached.urls;
      }
    }

    try {
      const sizes = options.sizes || [320, 640, 768, 1024, 1280];
      const urls = {};

      for (const size of sizes) {
        urls[size] = await this.getOptimizedUrl(publicId, {
          width: size,
          crop: 'scale',
          quality: 'auto',
          fetch_format: 'auto',
          ...options,
        });
      }

      const result = {
        urls,
        publicId,
        sizes,
        timestamp: new Date().toISOString(),
      };

      // Cache for 1 hour
      if (redisCache.isReady()) {
        await redisCache.set(cacheKey, result, 3600);
        logDebug('Cloudinary responsive URLs cached', { publicId });
      }

      logInfo('Cloudinary responsive URLs generated', { publicId, sizes });
      return urls;
    } catch (error) {
      logError('Cloudinary responsive URLs generation failed', error, { publicId });
      throw error;
    }
  }

  /**
   * Invalidate cache for specific image
   * @param {string} publicId - Cloudinary public ID
   */
  async invalidateImageCache(publicId) {
    if (redisCache.isReady()) {
      const patterns = [
        `${this.cachePrefix}url:*${this.hashString(publicId)}*`,
        `${this.cachePrefix}metadata:${this.hashString(publicId)}`,
        `${this.cachePrefix}responsive:*${this.hashString(publicId)}*`,
      ];

      for (const pattern of patterns) {
        await redisCache.invalidatePattern(pattern);
      }

      logInfo('Cloudinary image cache invalidated', { publicId });
    }
  }

  /**
   * Invalidate all Cloudinary cache
   */
  async invalidateAllCache() {
    if (redisCache.isReady()) {
      await redisCache.invalidatePattern('cloudinary:*');
      logInfo('All Cloudinary cache invalidated');
    }
  }

  /**
   * Get cache statistics for Cloudinary
   */
  async getCacheStats() {
    if (!redisCache.isReady()) {
      return { connected: false };
    }

    try {
      const keys = await redisCache.client.keys('cloudinary:*');
      const stats = {
        connected: true,
        totalKeys: keys.length,
        urlKeys: keys.filter((k) => k.includes('url:')).length,
        metadataKeys: keys.filter((k) => k.includes('metadata:')).length,
        responsiveKeys: keys.filter((k) => k.includes('responsive:')).length,
      };

      return stats;
    } catch (error) {
      logError('Error getting Cloudinary cache stats', error);
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

module.exports = new CloudinaryCache();
