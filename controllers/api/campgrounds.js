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

module.exports.index = asyncHandler(async (req, res) => {
  const campgrounds = await Campground.find({});
  const locations = await Campground.distinct('location');

  logInfo('Retrieved all campgrounds', { count: campgrounds.length });

  return ApiResponse.success({ campgrounds, locations }, 'Campgrounds retrieved successfully').send(
    res
  );
});

module.exports.createCampground = asyncHandler(async (req, res) => {
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.campground.location,
      limit: 1,
    })
    .send();

  if (!geoData.body.features.length) {
    logWarn('Invalid location provided', { location: req.body.campground.location });
    throw validationError('Invalid location', {
      location: 'Could not geocode the provided location',
    });
  }

  const campground = new Campground({
    title: req.body.campground.title,
    location: req.body.campground.location,
    description: req.body.campground.description,
    geometry: geoData.body.features[0].geometry,
    author: req.user._id,
  });

  if (req.files) {
    campground.images = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  }

  await campground.save();

  logInfo('Created new campground', {
    campgroundId: campground._id,
    title: campground.title,
    userId: req.user._id,
  });

  return ApiResponse.success({ campground }, 'Campground created successfully', 201).send(res);
});

module.exports.showCampground = asyncHandler(async (req, res) => {
  const campground = await Campground.findById(req.params.id)
    .populate({ path: 'reviews', populate: { path: 'author' } })
    .populate('author');

  if (!campground) {
    logWarn('Campground not found', { campgroundId: req.params.id });
    throw notFoundError('Campground', req.params.id);
  }

  logInfo('Retrieved campground details', {
    campgroundId: campground._id,
    title: campground.title,
  });

  return ApiResponse.success({ campground }, 'Campground retrieved successfully').send(res);
});

module.exports.searchCampgrounds = asyncHandler(async (req, res) => {
  const { search } = req.query;

  if (!search || search.trim() === '') {
    logWarn('Empty search term provided');
    throw validationError('Search term is required');
  }

  const campgrounds = await Campground.find({
    title: { $regex: new RegExp(search, 'i') },
  });

  logInfo('Performed campground search', {
    searchTerm: search,
    resultsCount: campgrounds.length,
  });

  return ApiResponse.success(
    { campgrounds, searchTerm: search },
    `Found ${campgrounds.length} campgrounds matching "${search}"`
  ).send(res);
});

module.exports.updateCampground = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate campground data
  if (!req.body.campground) {
    logWarn('Missing campground data in update request');
    throw validationError('Campground data is required');
  }

  // Get geocoding data if location is provided
  let geometry = undefined;
  if (req.body.campground.location) {
    try {
      const geoData = await geocoder
        .forwardGeocode({
          query: req.body.campground.location,
          limit: 1,
        })
        .send();

      if (!geoData.body.features.length) {
        logWarn('Invalid location provided for update', {
          location: req.body.campground.location,
          campgroundId: id,
        });
        throw validationError('Invalid location', {
          location: 'Could not geocode the provided location',
        });
      }

      geometry = geoData.body.features[0].geometry;
    } catch (error) {
      if (error.statusCode === 400) {
        // Re-throw validation errors
        throw error;
      }
      logError('Geocoding error during campground update', {
        error,
        location: req.body.campground.location,
        campgroundId: id,
      });
      throw serverError('Error processing location data');
    }
  }

  // Build update object
  const updateData = {
    title: req.body.campground.title,
    location: req.body.campground.location,
    description: req.body.campground.description,
  };

  if (geometry) {
    updateData.geometry = geometry;
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
      // Delete from cloudinary
      for (let filename of req.body.deleteImages) {
        await cloudinary.uploader.destroy(filename);
      }
      // Remove from campground
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
      // Continue with the update even if image deletion fails
    }
  }

  await campground.save();

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

  logInfo('Campground deleted successfully', { campgroundId: id });

  return ApiResponse.success(null, 'Campground deleted successfully').send(res);
});
