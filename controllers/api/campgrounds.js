const Campground = require('../../models/campground');
const { cloudinary } = require('../../cloudinary');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const config = require('../../config');
const geocoder = mbxGeocoding({ accessToken: config.mapbox.token });
const ApiResponse = require('../../utils/ApiResponse');
const {
  asyncHandler,
  notFoundError,
  validationError,
  serverError,
} = require('../../utils/errorHandler');
const { logInfo, logWarn, logError } = require('../../utils/logger');
const redisCache = require('../../utils/redis');

module.exports.index = asyncHandler(async (req, res) => {
  // Try to get from cache first
  const cacheKey = 'campgrounds:all';
  let cachedData = null;

  if (redisCache.isReady()) {
    cachedData = await redisCache.get(cacheKey);
  }

  if (cachedData) {
    logInfo('Serving campgrounds from cache', { count: cachedData.campgrounds.length });
    return ApiResponse.success(cachedData, 'Campgrounds retrieved successfully (cached)').send(res);
  }

  // Fetch from database
  const campgrounds = await Campground.find({});
  const locations = await Campground.distinct('location');

  const data = { campgrounds, locations };

  // Cache the result
  if (redisCache.isReady()) {
    await redisCache.setWithDefaultTTL(cacheKey, data, 'campgrounds');
  }

  logInfo('Retrieved all campgrounds from database', { count: campgrounds.length });

  return ApiResponse.success(data, 'Campgrounds retrieved successfully').send(res);
});

module.exports.createCampground = asyncHandler(async (req, res) => {
  let { title, location, description, geometry } = req.body.campground || {};

  // Parse geometry if it's a string
  if (geometry && typeof geometry === 'string') {
    try {
      geometry = JSON.parse(geometry);
    } catch (e) {
      geometry = undefined;
    }
  }

  let finalGeometry = geometry;
  let finalLocation = location;

  // If geometry is not provided, geocode the location string
  if (!finalGeometry && location) {
    const geoData = await geocoder
      .forwardGeocode({
        query: location,
        limit: 1,
      })
      .send();
    if (!geoData.body.features.length) {
      logWarn('Invalid location provided', { location });
      throw validationError('Invalid location', {
        location: 'Could not geocode the provided location',
      });
    }
    finalGeometry = geoData.body.features[0].geometry;
  }

  // If geometry is provided but location is not, reverse geocode to get address
  if (finalGeometry && !finalLocation) {
    const reverseGeo = await geocoder
      .reverseGeocode({
        query: finalGeometry.coordinates,
        limit: 1,
      })
      .send();
    if (reverseGeo.body.features && reverseGeo.body.features.length > 0) {
      finalLocation = reverseGeo.body.features[0].place_name;
    }
  }

  // Require at least geometry
  if (!finalGeometry) {
    throw validationError('Location or coordinates are required', {
      location: 'Location or coordinates are required',
    });
  }

  const campground = new Campground({
    title,
    location: finalLocation,
    description,
    geometry: finalGeometry,
    author: req.user._id,
  });

  if (req.files) {
    campground.images = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  }

  await campground.save();

  // Invalidate cache after creating new campground
  if (redisCache.isReady()) {
    await redisCache.invalidatePattern('campgrounds:*');
    logInfo('Invalidated campground cache after creation');
  }

  logInfo('Created new campground', {
    campgroundId: campground._id,
    title: campground.title,
    userId: req.user._id,
  });

  return ApiResponse.success({ campground }, 'Campground created successfully', 201).send(res);
});

module.exports.showCampground = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Try to get from cache first
  const cacheKey = `campground:${id}`;
  let cachedData = null;

  if (redisCache.isReady()) {
    cachedData = await redisCache.get(cacheKey);
  }

  if (cachedData) {
    logInfo('Serving campground from cache', { campgroundId: id });
    return ApiResponse.success(cachedData, 'Campground retrieved successfully (cached)').send(res);
  }

  // Fetch from database
  const campground = await Campground.findById(id)
    .populate({ path: 'reviews', populate: { path: 'author' } })
    .populate('author');

  if (!campground) {
    logWarn('Campground not found', { campgroundId: id });
    throw notFoundError('Campground', id);
  }

  const data = { campground };

  // Cache the result
  if (redisCache.isReady()) {
    await redisCache.setWithDefaultTTL(cacheKey, data, 'campgrounds');
  }

  logInfo('Retrieved campground details from database', {
    campgroundId: campground._id,
    title: campground.title,
  });

  return ApiResponse.success(data, 'Campground retrieved successfully').send(res);
});

module.exports.searchCampgrounds = asyncHandler(async (req, res) => {
  const { search } = req.query;

  if (!search || search.trim() === '') {
    logWarn('Empty search term provided');
    throw validationError('Search term is required');
  }

  // Try to get from cache first
  const cacheKey = `search:campgrounds:${search.toLowerCase()}`;
  let cachedData = null;

  if (redisCache.isReady()) {
    cachedData = await redisCache.get(cacheKey);
  }

  if (cachedData) {
    logInfo('Serving search results from cache', {
      searchTerm: search,
      resultsCount: cachedData.campgrounds.length,
    });
    return ApiResponse.success(
      cachedData,
      `Found ${cachedData.campgrounds.length} campgrounds matching "${search}" (cached)`
    ).send(res);
  }

  // Fetch from database
  const campgrounds = await Campground.find({
    title: { $regex: new RegExp(search, 'i') },
  });

  const data = { campgrounds, searchTerm: search };

  // Cache the result with shorter TTL for search results
  if (redisCache.isReady()) {
    await redisCache.setWithDefaultTTL(cacheKey, data, 'searchResults');
  }

  logInfo('Performed campground search from database', {
    searchTerm: search,
    resultsCount: campgrounds.length,
  });

  return ApiResponse.success(
    data,
    `Found ${campgrounds.length} campgrounds matching "${search}"`
  ).send(res);
});

module.exports.updateCampground = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.body.campground) {
    logWarn('Missing campground data in update request');
    throw validationError('Campground data is required');
  }

  let { title, location, description, geometry } = req.body.campground;

  // Parse geometry if it's a string
  if (geometry && typeof geometry === 'string') {
    try {
      geometry = JSON.parse(geometry);
    } catch (e) {
      geometry = undefined;
    }
  }

  let finalGeometry = geometry;
  let finalLocation = location;

  // If geometry is not provided but location is present, geocode
  if (!finalGeometry && location) {
    try {
      const geoData = await geocoder
        .forwardGeocode({
          query: location,
          limit: 1,
        })
        .send();
      if (!geoData.body.features.length) {
        logWarn('Invalid location provided for update', {
          location,
          campgroundId: id,
        });
        throw validationError('Invalid location', {
          location: 'Could not geocode the provided location',
        });
      }
      finalGeometry = geoData.body.features[0].geometry;
    } catch (error) {
      if (error.statusCode === 400) {
        throw error;
      }
      logError('Geocoding error during campground update', {
        error,
        location,
        campgroundId: id,
      });
      throw serverError('Error processing location data');
    }
  }

  // If geometry is provided but location is not, reverse geocode
  if (finalGeometry && !finalLocation) {
    const reverseGeo = await geocoder
      .reverseGeocode({
        query: finalGeometry.coordinates,
        limit: 1,
      })
      .send();
    if (reverseGeo.body.features && reverseGeo.body.features.length > 0) {
      finalLocation = reverseGeo.body.features[0].place_name;
    }
  }

  // Build update object
  const updateData = {
    title,
    location: finalLocation,
    description,
  };

  if (finalGeometry) {
    updateData.geometry = finalGeometry;
  }

  // Find and update the campground
  const campground = await Campground.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!campground) {
    logger.warn('Campground not found during update', { campgroundId: id });
    throw notFoundError('Campground', id);
  }

  // Add new images if any
  if (req.files && req.files.length > 0) {
    const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
    campground.images.push(...imgs);
    logInfo('Added new images to campground', {
      campgroundId: id,
      imageCount: req.files.length,
    });
  }

  // Delete images if specified
  if (req.body.deleteImages && req.body.deleteImages.length > 0) {
    try {
      for (let filename of req.body.deleteImages) {
        await cloudinary.uploader.destroy(filename);
      }
      await campground.updateOne({
        $pull: { images: { filename: { $in: req.body.deleteImages } } },
      });
      logInfo('Deleted images from campground', {
        campgroundId: id,
        deletedCount: req.body.deleteImages.length,
        imageIds: req.body.deleteImages,
      });
    } catch (error) {
      logError('Error deleting images from cloudinary', {
        error,
        campgroundId: id,
        imageIds: req.body.deleteImages,
      });
    }
  }

  await campground.save();

  // Invalidate cache after updating campground
  if (redisCache.isReady()) {
    await redisCache.invalidatePattern('campgrounds:*');
    await redisCache.del(`campground:${id}`);
    logInfo('Invalidated campground cache after update');
  }

  logInfo('Updated campground', {
    campgroundId: id,
    title: campground.title,
    userId: req.user._id,
  });

  return ApiResponse.success({ campground }, 'Campground updated successfully').send(res);
});

module.exports.deleteCampground = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);

  if (!campground) {
    logWarn('Campground not found during delete attempt', { campgroundId: id });
    throw notFoundError('Campground', id);
  }

  // Log the delete operation
  logInfo('Deleting campground', {
    campgroundId: id,
    title: campground.title,
    userId: req.user._id,
    imageCount: campground.images.length,
  });

  // Delete images from cloudinary
  if (campground.images && campground.images.length > 0) {
    try {
      for (let image of campground.images) {
        await cloudinary.uploader.destroy(image.filename);
      }
      logInfo('Deleted campground images from cloudinary', {
        campgroundId: id,
        imageCount: campground.images.length,
      });
    } catch (error) {
      logError('Error deleting campground images from cloudinary', {
        error,
        campgroundId: id,
      });
      // Continue with deletion even if image deletion fails
    }
  }

  await Campground.findByIdAndDelete(id);

  // Invalidate cache after deleting campground
  if (redisCache.isReady()) {
    await redisCache.invalidatePattern('campgrounds:*');
    await redisCache.del(`campground:${id}`);
    logInfo('Invalidated campground cache after deletion');
  }

  logInfo('Campground deleted successfully', { campgroundId: id });

  return ApiResponse.success(null, 'Campground deleted successfully').send(res);
});
