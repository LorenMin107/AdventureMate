const Campsite = require('../../models/campsite');
const Campground = require('../../models/campground');
const User = require('../../models/user');
const { cloudinary } = require('../../cloudinary');
const ApiResponse = require('../../utils/ApiResponse');
const ExpressError = require('../../utils/ExpressError');
const { logError, logInfo, logWarn, logDebug } = require('../../utils/logger');

// Get all campsites for a campground
module.exports.index = async (req, res) => {
  try {
    const { campgroundId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify campground exists
    const campground = await Campground.findById(campgroundId);
    if (!campground) {
      return ApiResponse.error(
        'Campground not found',
        'The requested campground does not exist',
        404
      ).send(res);
    }

    // Find all campsites for this campground
    let campsites = await Campsite.find({ campground: campgroundId });

    // If date parameters are provided, filter campsites by availability for those dates
    if (startDate && endDate) {
      // Filter campsites that are available for the requested dates
      campsites = campsites.filter((campsite) => {
        return campsite.isAvailableForDates(startDate, endDate);
      });
    }

    return ApiResponse.success({ campsites }, 'Campsites retrieved successfully').send(res);
  } catch (error) {
    logError('Failed to fetch campsites', error, {
      endpoint: '/api/v1/campsites',
      userId: req.user?._id,
    });
    return ApiResponse.error(
      'Failed to fetch campsites',
      'An error occurred while retrieving campsites',
      500
    ).send(res);
  }
};

// Create a new campsite
module.exports.createCampsite = async (req, res) => {
  try {
    const { campgroundId } = req.params;

    // Verify campground exists
    const campground = await Campground.findById(campgroundId);
    if (!campground) {
      return ApiResponse.error(
        'Campground not found',
        'The requested campground does not exist',
        404
      ).send(res);
    }

    // Verify user is the owner of the campground
    if (campground.owner && campground.owner.toString() !== req.user._id.toString()) {
      return ApiResponse.error(
        'Unauthorized',
        'You do not have permission to add campsites to this campground',
        403
      ).send(res);
    }

    // Field-level validation
    const errors = [];
    const { name, description, price, capacity } = req.body.campsite || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.push({ field: 'name', message: 'Name is required' });
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      errors.push({ field: 'description', message: 'Description is required' });
    }
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) <= 0) {
      errors.push({ field: 'price', message: 'Price must be a positive number' });
    }
    if (
      capacity === undefined ||
      capacity === null ||
      isNaN(Number(capacity)) ||
      Number(capacity) < 1
    ) {
      errors.push({ field: 'capacity', message: 'Capacity must be at least 1' });
    }
    // You can add more field validations here as needed

    if (errors.length > 0) {
      return ApiResponse.error({ errors }, 'Validation failed', 400).send(res);
    }

    // Create new campsite
    const campsite = new Campsite({
      name,
      description,
      features: req.body.campsite.features,
      price,
      capacity,
      campground: campgroundId,
      availability: req.body.campsite.availability,
    });

    // Add images if provided
    if (req.files) {
      campsite.images = req.files.map((f) => ({ url: f.path, filename: f.filename }));
    }

    await campsite.save();

    // Add campsite to campground
    campground.campsites.push(campsite._id);
    await campground.save();

    return ApiResponse.success({ campsite }, 'Campsite created successfully', 201).send(res);
  } catch (error) {
    logError('Error creating campsite', error, {
      endpoint: '/api/v1/campsites',
      userId: req.user?._id,
      campgroundId: req.params.campgroundId,
    });
    return ApiResponse.error(
      error.message || 'Failed to create campsite',
      'An error occurred while creating the campsite',
      400
    ).send(res);
  }
};

// Get a specific campsite
module.exports.showCampsite = async (req, res) => {
  try {
    const { id } = req.params;

    const campsite = await Campsite.findById(id).populate('campground');

    if (!campsite) {
      return ApiResponse.error(
        'Campsite not found',
        'The requested campsite does not exist',
        404
      ).send(res);
    }

    return ApiResponse.success({ campsite }, 'Campsite retrieved successfully').send(res);
  } catch (error) {
    logError('Error fetching campsite', error, {
      endpoint: '/api/v1/campsites/:id',
      userId: req.user?._id,
      campsiteId: req.params.id,
    });
    return ApiResponse.error(
      'Failed to fetch campsite',
      'An error occurred while retrieving the campsite',
      500
    ).send(res);
  }
};

// Update a campsite
module.exports.updateCampsite = async (req, res) => {
  try {
    const { id } = req.params;

    const campsite = await Campsite.findById(id);

    if (!campsite) {
      return ApiResponse.error(
        'Campsite not found',
        'The requested campsite does not exist',
        404
      ).send(res);
    }

    // Get the campground ID from the campsite
    const campgroundId = campsite.campground;
    if (!campgroundId) {
      return ApiResponse.error(
        'Invalid campsite data',
        'The campsite is not associated with a campground',
        400
      ).send(res);
    }

    // Verify user is the owner of the parent campground
    const campground = await Campground.findById(campgroundId);
    if (!campground) {
      return ApiResponse.error(
        'Campground not found',
        'The parent campground does not exist',
        404
      ).send(res);
    }

    // Check if user is the owner or an admin
    const isOwner =
      (campground.owner && campground.owner.toString() === req.user._id.toString()) ||
      (campground.author && campground.author.toString() === req.user._id.toString());

    if (!isOwner && !req.user.isAdmin) {
      return ApiResponse.error(
        'Unauthorized',
        'You do not have permission to update this campsite',
        403
      ).send(res);
    }

    // Update campsite fields
    campsite.name = req.body.campsite.name;
    campsite.description = req.body.campsite.description;
    campsite.features = req.body.campsite.features;
    campsite.price = req.body.campsite.price;
    campsite.capacity = req.body.campsite.capacity;
    campsite.availability = req.body.campsite.availability;

    // Add new images if any
    if (req.files && req.files.length > 0) {
      const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
      campsite.images.push(...imgs);
    }

    // Delete images if specified
    if (req.body.deleteImages && req.body.deleteImages.length > 0) {
      // Delete from cloudinary
      for (let filename of req.body.deleteImages) {
        await cloudinary.uploader.destroy(filename);
      }
      // Remove from campsite
      await campsite.updateOne({
        $pull: { images: { filename: { $in: req.body.deleteImages } } },
      });
    }

    await campsite.save();

    return ApiResponse.success({ campsite }, 'Campsite updated successfully').send(res);
  } catch (error) {
    logError('Error updating campsite', error, {
      endpoint: '/api/v1/campsites/:id',
      userId: req.user?._id,
      campsiteId: req.params.id,
    });
    return ApiResponse.error(
      error.message || 'Failed to update campsite',
      'An error occurred while updating the campsite',
      400
    ).send(res);
  }
};

// Delete a campsite
module.exports.deleteCampsite = async (req, res) => {
  try {
    const { id } = req.params;

    const campsite = await Campsite.findById(id);

    if (!campsite) {
      return ApiResponse.error(
        'Campsite not found',
        'The requested campsite does not exist',
        404
      ).send(res);
    }

    // Get the campground ID from the campsite
    const campgroundId = campsite.campground;
    if (!campgroundId) {
      return ApiResponse.error(
        'Invalid campsite data',
        'The campsite is not associated with a campground',
        400
      ).send(res);
    }

    // Verify user is the owner of the parent campground
    const campground = await Campground.findById(campgroundId);
    if (!campground) {
      return ApiResponse.error(
        'Campground not found',
        'The parent campground does not exist',
        404
      ).send(res);
    }

    // Check if user is the owner or an admin
    const isOwner =
      (campground.owner && campground.owner.toString() === req.user._id.toString()) ||
      (campground.author && campground.author.toString() === req.user._id.toString());

    if (!isOwner && !req.user.isAdmin) {
      return ApiResponse.error(
        'Unauthorized',
        'You do not have permission to delete this campsite',
        403
      ).send(res);
    }

    // Delete images from cloudinary
    for (let image of campsite.images) {
      await cloudinary.uploader.destroy(image.filename);
    }

    // Remove campsite from campground
    await Campground.findByIdAndUpdate(campsite.campground, {
      $pull: { campsites: campsite._id },
    });

    await Campsite.findByIdAndDelete(id);

    return ApiResponse.success(null, 'Campsite deleted successfully').send(res);
  } catch (error) {
    logError('Error deleting campsite', error, {
      endpoint: '/api/v1/campsites/:id',
      userId: req.user?._id,
      campsiteId: req.params.id,
    });
    return ApiResponse.error(
      'Failed to delete campsite',
      'An error occurred while deleting the campsite',
      500
    ).send(res);
  }
};
