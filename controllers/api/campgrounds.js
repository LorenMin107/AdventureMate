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
  const cacheKey = 'campgrounds:all:v2'; // Updated cache key to force refresh with author population
  let cachedData = null;

  if (redisCache.isReady()) {
    cachedData = await redisCache.get(cacheKey);
  }

  if (cachedData) {
    logInfo('Serving campgrounds from cache', { count: cachedData.campgrounds.length });
    return ApiResponse.success(cachedData, 'Campgrounds retrieved successfully (cached)').send(res);
  }

  // Fetch from database with campsites and author populated
  const campgrounds = await Campground.find({})
    .populate('campsites', 'name price availability')
    .populate('author', 'username email');
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

  // Field-level validation
  const errors = [];
  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push({ field: 'title', message: 'Title is required' });
  }
  if (!location || typeof location !== 'string' || !location.trim()) {
    errors.push({ field: 'location', message: 'Location is required' });
  }
  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.push({ field: 'description', message: 'Description is required' });
  }
  // You can add more field validations here as needed

  if (errors.length > 0) {
    return ApiResponse.error({ errors }, 'Validation failed', 400).send(res);
  }

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
      return ApiResponse.error(
        {
          errors: [
            { field: 'location', message: 'Invalid location. Please provide a valid address.' },
          ],
        },
        'Validation failed',
        400
      ).send(res);
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
    return ApiResponse.error(
      { errors: [{ field: 'location', message: 'Location or coordinates are required' }] },
      'Validation failed',
      400
    ).send(res);
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

  let campground;
  if (cachedData) {
    logInfo('Serving campground from cache', { campgroundId: id });
    campground = cachedData.campground || cachedData;
  } else {
    // Fetch from database
    campground = await Campground.findById(id)
      .populate({ path: 'reviews', populate: { path: 'author' } })
      .populate('author');

    if (!campground) {
      logWarn('Campground not found', { campgroundId: id });
      throw notFoundError('Campground', id);
    }
  }

  // Ensure address components are present
  let addressFields = ['street', 'city', 'state', 'country'];
  let missingFields = addressFields.filter((f) => !campground[f]);
  if (missingFields.length > 0 && campground.geometry && campground.geometry.coordinates) {
    // Perform reverse geocoding
    try {
      const reverseGeo = await geocoder
        .reverseGeocode({
          query: campground.geometry.coordinates,
          limit: 1,
        })
        .send();
      if (reverseGeo.body.features && reverseGeo.body.features.length > 0) {
        const components = reverseGeo.body.features[0].context || [];
        // Mapbox context array contains address components
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
        if (!street && reverseGeo.body.features[0].place_type.includes('address')) {
          street = reverseGeo.body.features[0].text;
        }
        // Patch missing fields
        if (!campground.street) campground.street = street;
        if (!campground.city) campground.city = city;
        if (!campground.state) campground.state = state;
        if (!campground.country) campground.country = country;
      }
    } catch (err) {
      logError('Reverse geocoding failed for campground', { id, err });
    }
  }

  const data = { campground };

  // Cache the result
  if (redisCache.isReady()) {
    await redisCache.setWithDefaultTTL(cacheKey, data, 'campgrounds');
  }

  logInfo('Retrieved campground details', {
    campgroundId: campground._id,
    title: campground.title,
  });

  return ApiResponse.success(data, 'Campground retrieved successfully').send(res);
});

module.exports.searchCampgrounds = asyncHandler(async (req, res) => {
  const { search, sort = 'relevance', limit = 20, page = 1 } = req.query;

  if (!search || search.trim() === '') {
    logWarn('Empty search term provided');
    throw validationError('Search term is required');
  }

  const searchTerm = search.trim();
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Try to get from cache first
  const cacheKey = `search:campgrounds:${searchTerm.toLowerCase()}:${sort}:${limit}:${page}`;
  let cachedData = null;

  if (redisCache.isReady()) {
    cachedData = await redisCache.get(cacheKey);
  }

  if (cachedData) {
    logInfo('Serving search results from cache', {
      searchTerm,
      resultsCount: cachedData.campgrounds.length,
      sort,
      page,
    });
    return ApiResponse.success(
      cachedData,
      `Found ${cachedData.campgrounds.length} campgrounds matching "${searchTerm}" (cached)`
    ).send(res);
  }

  // Build search query using full-text search
  const searchQuery = {
    $text: { $search: searchTerm },
  };

  // Build sort options
  let sortOptions = {};
  switch (sort) {
    case 'relevance':
      sortOptions = { score: { $meta: 'textScore' } };
      break;
    case 'title':
      sortOptions = { title: 1 };
      break;
    case 'location':
      sortOptions = { location: 1 };
      break;
    case 'newest':
      sortOptions = { createdAt: -1 };
      break;
    case 'oldest':
      sortOptions = { createdAt: 1 };
      break;
    default:
      sortOptions = { score: { $meta: 'textScore' } };
  }

  // Execute search with pagination
  const [campgrounds, total] = await Promise.all([
    Campground.find(searchQuery, { score: { $meta: 'textScore' } })
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reviews', 'rating')
      .populate('campsites', 'name price availability'),
    Campground.countDocuments(searchQuery),
  ]);

  // Calculate additional data for each campground
  const campgroundsWithStats = campgrounds.map((campground) => {
    const avgRating =
      campground.reviews.length > 0
        ? campground.reviews.reduce((sum, review) => sum + review.rating, 0) /
          campground.reviews.length
        : 0;

    const startingPrice =
      campground.campsites.length > 0
        ? Math.min(...campground.campsites.map((site) => site.price || 0))
        : 0;

    return {
      ...campground.toObject(),
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: campground.reviews.length,
      startingPrice,
      availableCampsites: campground.campsites.filter((site) => site.availability).length,
    };
  });

  const data = {
    campgrounds: campgroundsWithStats,
    searchTerm,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
    sort,
    searchAnalytics: {
      totalResults: total,
      searchTerm,
      timestamp: new Date().toISOString(),
    },
  };

  // Cache the result with shorter TTL for search results
  if (redisCache.isReady()) {
    await redisCache.setWithDefaultTTL(cacheKey, data, 'searchResults');
  }

  // Log search analytics
  logInfo('Performed enhanced campground search', {
    searchTerm,
    resultsCount: campgrounds.length,
    totalResults: total,
    sort,
    page,
    limit,
    userId: req.user?._id,
  });

  return ApiResponse.success(data, `Found ${total} campgrounds matching "${searchTerm}"`).send(res);
});

module.exports.getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q || q.trim() === '') {
    return ApiResponse.success(
      { suggestions: [], popularTerms: [] },
      'No search term provided'
    ).send(res);
  }

  const searchTerm = q.trim();

  // Try to get from cache first
  const cacheKey = `search:suggestions:${searchTerm.toLowerCase()}:${limit}`;
  let cachedData = null;

  if (redisCache.isReady()) {
    cachedData = await redisCache.get(cacheKey);
  }

  if (cachedData) {
    logInfo('Serving search suggestions from cache', {
      searchTerm,
      suggestionsCount: cachedData.suggestions.length,
    });
    return ApiResponse.success(cachedData, 'Search suggestions retrieved (cached)').send(res);
  }

  // Get title suggestions using aggregation instead of distinct with limit
  const titleSuggestions = await Campground.aggregate([
    {
      $match: {
        title: { $regex: new RegExp(searchTerm, 'i') },
      },
    },
    {
      $group: {
        _id: '$title',
      },
    },
    {
      $limit: parseInt(limit),
    },
    {
      $project: {
        _id: 0,
        title: '$_id',
      },
    },
  ]);

  // Get location suggestions using aggregation instead of distinct with limit
  const locationSuggestions = await Campground.aggregate([
    {
      $match: {
        location: { $regex: new RegExp(searchTerm, 'i') },
      },
    },
    {
      $group: {
        _id: '$location',
      },
    },
    {
      $limit: parseInt(limit),
    },
    {
      $project: {
        _id: 0,
        location: '$_id',
      },
    },
  ]);

  // Extract values from aggregation results
  const titleValues = titleSuggestions.map((item) => item.title);
  const locationValues = locationSuggestions.map((item) => item.location);

  // Combine and deduplicate suggestions
  const allSuggestions = [...titleValues, ...locationValues];
  const uniqueSuggestions = [...new Set(allSuggestions)].slice(0, parseInt(limit));

  // Get popular search terms (based on matching locations)
  const popularTerms = await Campground.aggregate([
    {
      $match: {
        $or: [
          { title: { $regex: new RegExp(searchTerm, 'i') } },
          { location: { $regex: new RegExp(searchTerm, 'i') } },
          { description: { $regex: new RegExp(searchTerm, 'i') } },
        ],
      },
    },
    {
      $group: {
        _id: '$location',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 5,
    },
  ]);

  const data = {
    suggestions: uniqueSuggestions,
    popularTerms: popularTerms.map((term) => term._id),
    searchTerm,
  };

  // Cache the result with shorter TTL for suggestions
  if (redisCache.isReady()) {
    await redisCache.setWithDefaultTTL(cacheKey, data, 'searchSuggestions');
  }

  logInfo('Generated search suggestions', {
    searchTerm,
    suggestionsCount: uniqueSuggestions.length,
    popularTermsCount: popularTerms.length,
    titleSuggestionsCount: titleValues.length,
    locationSuggestionsCount: locationValues.length,
  });

  return ApiResponse.success(data, 'Search suggestions retrieved successfully').send(res);
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
