const express = require('express');
const cloudinaryCache = require('../../../utils/cloudinaryCache');
const asyncHandler = require('../../../utils/catchAsync');
const ApiResponse = require('../../../utils/ApiResponse');
const { validationError } = require('../../../utils/errorHandler');
const { logInfo, logError } = require('../../../utils/logger');

const router = express.Router();

/**
 * Generate optimized image URL
 * GET /api/v1/cloudinary/url?publicId=...&width=...&height=...
 */
router.get(
  '/url',
  asyncHandler(async (req, res) => {
    const { publicId, width, height, crop, quality, format, ...options } = req.query;

    if (!publicId || !publicId.trim()) {
      throw validationError('Public ID parameter is required');
    }

    try {
      const transformOptions = { ...options };
      if (width) transformOptions.width = parseInt(width);
      if (height) transformOptions.height = parseInt(height);
      if (crop) transformOptions.crop = crop;
      if (quality) transformOptions.quality = quality;
      if (format) transformOptions.fetch_format = format;

      const url = await cloudinaryCache.getOptimizedUrl(publicId.trim(), transformOptions);

      logInfo('Cloudinary URL generation API call', {
        publicId: publicId.trim(),
        options: transformOptions,
        cached: true,
      });

      return ApiResponse.success(
        { url, publicId: publicId.trim() },
        'URL generated successfully'
      ).send(res);
    } catch (error) {
      logError('Cloudinary URL generation API error', error, { publicId: publicId.trim() });
      throw error;
    }
  })
);

/**
 * Get image metadata
 * GET /api/v1/cloudinary/metadata?publicId=...
 */
router.get(
  '/metadata',
  asyncHandler(async (req, res) => {
    const { publicId } = req.query;

    if (!publicId || !publicId.trim()) {
      throw validationError('Public ID parameter is required');
    }

    try {
      const metadata = await cloudinaryCache.getImageMetadata(publicId.trim());

      logInfo('Cloudinary metadata API call', {
        publicId: publicId.trim(),
        cached: true,
      });

      return ApiResponse.success(metadata, 'Metadata retrieved successfully').send(res);
    } catch (error) {
      logError('Cloudinary metadata API error', error, { publicId: publicId.trim() });
      throw error;
    }
  })
);

/**
 * Get multiple image metadata
 * POST /api/v1/cloudinary/metadata/batch
 */
router.post(
  '/metadata/batch',
  asyncHandler(async (req, res) => {
    const { publicIds } = req.body;

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      throw validationError('Public IDs array is required');
    }

    try {
      const metadata = await cloudinaryCache.getMultipleImageMetadata(publicIds);

      logInfo('Cloudinary batch metadata API call', {
        count: publicIds.length,
        cached: true,
      });

      return ApiResponse.success(metadata, 'Batch metadata retrieved successfully').send(res);
    } catch (error) {
      logError('Cloudinary batch metadata API error', error, { count: publicIds.length });
      throw error;
    }
  })
);

/**
 * Generate thumbnail URL
 * GET /api/v1/cloudinary/thumbnail?publicId=...&width=...&height=...
 */
router.get(
  '/thumbnail',
  asyncHandler(async (req, res) => {
    const { publicId, width = 300, height = 200, crop = 'fill', ...options } = req.query;

    if (!publicId || !publicId.trim()) {
      throw validationError('Public ID parameter is required');
    }

    try {
      const thumbnailOptions = {
        width: parseInt(width),
        height: parseInt(height),
        crop,
        ...options,
      };

      const url = await cloudinaryCache.getThumbnailUrl(publicId.trim(), thumbnailOptions);

      logInfo('Cloudinary thumbnail API call', {
        publicId: publicId.trim(),
        options: thumbnailOptions,
        cached: true,
      });

      return ApiResponse.success(
        { url, publicId: publicId.trim() },
        'Thumbnail generated successfully'
      ).send(res);
    } catch (error) {
      logError('Cloudinary thumbnail API error', error, { publicId: publicId.trim() });
      throw error;
    }
  })
);

/**
 * Generate responsive URLs
 * GET /api/v1/cloudinary/responsive?publicId=...&sizes=...
 */
router.get(
  '/responsive',
  asyncHandler(async (req, res) => {
    const { publicId, sizes = '320,640,768,1024', ...options } = req.query;

    if (!publicId || !publicId.trim()) {
      throw validationError('Public ID parameter is required');
    }

    try {
      const responsiveOptions = {
        sizes: sizes.split(',').map((s) => parseInt(s.trim())),
        ...options,
      };

      const urls = await cloudinaryCache.getResponsiveUrls(publicId.trim(), responsiveOptions);

      logInfo('Cloudinary responsive URLs API call', {
        publicId: publicId.trim(),
        sizes: responsiveOptions.sizes,
        cached: true,
      });

      return ApiResponse.success(
        { urls, publicId: publicId.trim() },
        'Responsive URLs generated successfully'
      ).send(res);
    } catch (error) {
      logError('Cloudinary responsive URLs API error', error, { publicId: publicId.trim() });
      throw error;
    }
  })
);

/**
 * Get cache statistics
 * GET /api/v1/cloudinary/cache-stats
 */
router.get(
  '/cache-stats',
  asyncHandler(async (req, res) => {
    try {
      const stats = await cloudinaryCache.getCacheStats();
      return ApiResponse.success(stats, 'Cache statistics retrieved').send(res);
    } catch (error) {
      logError('Cloudinary cache stats API error', error);
      throw error;
    }
  })
);

/**
 * Invalidate cache for specific image
 * POST /api/v1/cloudinary/invalidate-image
 */
router.post(
  '/invalidate-image',
  asyncHandler(async (req, res) => {
    const { publicId } = req.body;

    if (!publicId || !publicId.trim()) {
      throw validationError('Public ID parameter is required');
    }

    try {
      await cloudinaryCache.invalidateImageCache(publicId.trim());

      logInfo('Cloudinary image cache invalidated via API', { publicId: publicId.trim() });

      return ApiResponse.success(
        { publicId: publicId.trim(), message: 'Image cache invalidated successfully' },
        'Image cache invalidated'
      ).send(res);
    } catch (error) {
      logError('Cloudinary image cache invalidation API error', error, {
        publicId: publicId.trim(),
      });
      throw error;
    }
  })
);

/**
 * Invalidate all Cloudinary cache
 * POST /api/v1/cloudinary/invalidate-all
 */
router.post(
  '/invalidate-all',
  asyncHandler(async (req, res) => {
    try {
      await cloudinaryCache.invalidateAllCache();

      logInfo('All Cloudinary cache invalidated via API');

      return ApiResponse.success(
        { message: 'All Cloudinary cache invalidated successfully' },
        'All cache invalidated'
      ).send(res);
    } catch (error) {
      logError('Cloudinary cache invalidation API error', error);
      throw error;
    }
  })
);

module.exports = router;
