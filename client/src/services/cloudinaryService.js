import api from '../utils/api';

/**
 * Frontend service for Cloudinary operations using cached backend endpoints
 */
class CloudinaryService {
  /**
   * Generate optimized image URL
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - Transformation options
   * @returns {Promise<string>} Optimized image URL
   */
  static async getOptimizedUrl(publicId, options = {}) {
    try {
      const response = await api.get('/api/v1/cloudinary/url', {
        params: { publicId, ...options },
      });
      return response.data.data.url;
    } catch (error) {
      console.error('Cloudinary URL generation failed:', error);
      throw error;
    }
  }

  /**
   * Get image metadata
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Image metadata
   */
  static async getImageMetadata(publicId) {
    try {
      const response = await api.get('/api/v1/cloudinary/metadata', {
        params: { publicId },
      });
      return response.data.data;
    } catch (error) {
      console.error('Cloudinary metadata retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Get multiple image metadata
   * @param {string[]} publicIds - Array of Cloudinary public IDs
   * @returns {Promise<Object[]>} Array of image metadata
   */
  static async getMultipleImageMetadata(publicIds) {
    try {
      const response = await api.post('/api/v1/cloudinary/metadata/batch', {
        publicIds,
      });
      return response.data.data;
    } catch (error) {
      console.error('Cloudinary batch metadata retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail URL
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - Thumbnail options
   * @returns {Promise<string>} Thumbnail URL
   */
  static async getThumbnailUrl(publicId, options = {}) {
    try {
      const response = await api.get('/api/v1/cloudinary/thumbnail', {
        params: { publicId, ...options },
      });
      return response.data.data.url;
    } catch (error) {
      console.error('Cloudinary thumbnail generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate responsive image URLs
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - Responsive options
   * @returns {Promise<Object>} Responsive URLs
   */
  static async getResponsiveUrls(publicId, options = {}) {
    try {
      const response = await api.get('/api/v1/cloudinary/responsive', {
        params: {
          publicId,
          sizes: options.sizes ? options.sizes.join(',') : undefined,
          ...options,
        },
      });
      return response.data.data.urls;
    } catch (error) {
      console.error('Cloudinary responsive URLs generation failed:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  static async getCacheStats() {
    try {
      const response = await api.get('/api/v1/cloudinary/cache-stats');
      return response.data.data;
    } catch (error) {
      console.error('Cloudinary cache stats retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Invalidate cache for specific image
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Invalidation result
   */
  static async invalidateImageCache(publicId) {
    try {
      const response = await api.post('/api/v1/cloudinary/invalidate-image', {
        publicId,
      });
      return response.data.data;
    } catch (error) {
      console.error('Cloudinary image cache invalidation failed:', error);
      throw error;
    }
  }

  /**
   * Invalidate all Cloudinary cache
   * @returns {Promise<Object>} Invalidation result
   */
  static async invalidateAllCache() {
    try {
      const response = await api.post('/api/v1/cloudinary/invalidate-all');
      return response.data.data;
    } catch (error) {
      console.error('Cloudinary cache invalidation failed:', error);
      throw error;
    }
  }
}

export default CloudinaryService;
