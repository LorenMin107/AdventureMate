const Campground = require('../../models/campground');
const Campsite = require('../../models/campsite');
const Owner = require('../../models/owner');
const Booking = require('../../models/booking');
const Review = require('../../models/review');
const ExpressError = require('../../utils/ExpressError');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const config = require('../../config');
const { cloudinary } = require('../../cloudinary');
const { logError, logInfo, logDebug } = require('../../utils/logger');

const geocoder = mbxGeocoding({ accessToken: config.mapbox.token });

/**
 * Get all campgrounds owned by the current owner
 * GET /api/owners/campgrounds
 */
const getOwnerCampgrounds = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { owner: req.user._id };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const campgrounds = await Campground.find(query)
      .populate('campsites')
      .populate('reviews', 'rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Campground.countDocuments(query);

    // Calculate additional stats for each campground
    const campgroundsWithStats = await Promise.all(
      campgrounds.map(async (campground) => {
        const bookingStats = await Booking.aggregate([
          {
            $match: {
              campground: campground._id,
              status: 'confirmed',
              paid: true,
            },
          },
          {
            $group: {
              _id: null,
              totalBookings: { $sum: 1 },
              totalRevenue: { $sum: '$totalPrice' },
            },
          },
        ]);

        const stats = bookingStats[0] || { totalBookings: 0, totalRevenue: 0 };
        const averageRating =
          campground.reviews.length > 0
            ? campground.reviews.reduce((sum, review) => sum + review.rating, 0) /
              campground.reviews.length
            : 0;

        return {
          ...campground.toObject(),
          stats: {
            ...stats,
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: campground.reviews.length,
            totalCampsites: campground.campsites.length,
          },
        };
      })
    );

    res.json({
      campgrounds: campgroundsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logError('Error fetching owner campgrounds', error, { 
      endpoint: '/api/owners/campgrounds',
      userId: req.user?._id,
      query: req.query 
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch campgrounds',
    });
  }
};

/**
 * Create a new campground
 * POST /api/owners/campgrounds
 */
const createCampground = async (req, res) => {
  try {
    const { title, description, location } = req.body;

    // Geocode the location
    const geoData = await geocoder
      .forwardGeocode({
        query: location,
        limit: 1,
      })
      .send();

    if (!geoData.body.features || geoData.body.features.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid location. Please provide a valid address.',
      });
    }

    // Create campground
    const campground = new Campground({
      title,
      description,
      location,
      geometry: geoData.body.features[0].geometry,
      author: req.user._id, // For backward compatibility
      owner: req.user._id,
      images: req.files ? req.files.map((f) => ({ url: f.path, filename: f.filename })) : [],
    });

    await campground.save();

    // Add campground to owner's campgrounds array
    await Owner.findOneAndUpdate(
      { user: req.user._id },
      { $push: { campgrounds: campground._id } }
    );

    res.status(201).json({
      message: 'Campground created successfully',
      campground,
    });
  } catch (error) {
    logError('Error creating campground', error, { 
      endpoint: '/api/owners/campgrounds',
      userId: req.user?._id,
      body: { title: req.body.title, location: req.body.location } 
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create campground',
    });
  }
};

/**
 * Get a specific campground owned by the current owner
 * GET /api/owners/campgrounds/:id
 */
const getOwnerCampground = async (req, res) => {
  try {
    const campground = await Campground.findOne({
      _id: req.params.id,
      owner: req.user._id,
    })
      .populate('campsites')
      .populate({
        path: 'reviews',
        populate: { path: 'author', select: 'username' },
      })
      .populate('bookings');

    if (!campground) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campground not found or you do not have permission to access it',
      });
    }

    // Get booking statistics
    const bookingStats = await Booking.aggregate([
      {
        $match: {
          campground: campground._id,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
    ]);

    // Get recent bookings
    const recentBookings = await Booking.find({
      campground: campground._id,
    })
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(5);

    const stats = {
      totalBookings: bookingStats.reduce((sum, stat) => sum + stat.count, 0),
      totalRevenue: bookingStats.reduce((sum, stat) => sum + stat.revenue, 0),
      statusBreakdown: bookingStats,
      averageRating:
        campground.reviews.length > 0
          ? campground.reviews.reduce((sum, review) => sum + review.rating, 0) /
            campground.reviews.length
          : 0,
      totalReviews: campground.reviews.length,
    };

    res.json({
      campground,
      stats,
      recentBookings,
    });
  } catch (error) {
    logError('Error fetching campground', error, { 
      endpoint: '/api/owners/campgrounds/:id',
      userId: req.user?._id,
      campgroundId: req.params.id 
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch campground',
    });
  }
};

/**
 * Update a campground
 * PUT /api/owners/campgrounds/:id
 */
const updateCampground = async (req, res) => {
  try {
    const { title, description, location, deleteImages } = req.body;

    const campground = await Campground.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!campground) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campground not found or you do not have permission to access it',
      });
    }

    // Update basic fields
    if (title) campground.title = title;
    if (description) campground.description = description;

    // Update location and geocode if changed
    if (location && location !== campground.location) {
      const geoData = await geocoder
        .forwardGeocode({
          query: location,
          limit: 1,
        })
        .send();

      if (geoData.body.features && geoData.body.features.length > 0) {
        campground.location = location;
        campground.geometry = geoData.body.features[0].geometry;
      }
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((f) => ({ url: f.path, filename: f.filename }));
      campground.images.push(...newImages);
    }

    // Delete specified images
    if (deleteImages && deleteImages.length > 0) {
      for (let filename of deleteImages) {
        await cloudinary.uploader.destroy(filename);
      }
      campground.images = campground.images.filter((img) => !deleteImages.includes(img.filename));
    }

    await campground.save();

    res.json({
      message: 'Campground updated successfully',
      campground,
    });
  } catch (error) {
    logError('Error updating campground', error, { 
      endpoint: '/api/owners/campgrounds/:id',
      userId: req.user?._id,
      campgroundId: req.params.id 
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update campground',
    });
  }
};

/**
 * Delete a campground
 * DELETE /api/owners/campgrounds/:id
 */
const deleteCampground = async (req, res) => {
  try {
    const campground = await Campground.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!campground) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campground not found or you do not have permission to access it',
      });
    }

    // Check if there are any active bookings
    const activeBookings = await Booking.countDocuments({
      campground: campground._id,
      status: { $in: ['pending', 'confirmed'] },
      endDate: { $gte: new Date() },
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message:
          'Cannot delete campground with active bookings. Please cancel or complete all bookings first.',
      });
    }

    // Delete associated images from cloudinary
    for (let image of campground.images) {
      if (image.filename) {
        await cloudinary.uploader.destroy(image.filename);
      }
    }

    // Remove campground from owner's campgrounds array
    await Owner.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { campgrounds: campground._id } }
    );

    // Delete the campground (this will trigger the post middleware to delete reviews and bookings)
    await Campground.findByIdAndDelete(campground._id);

    res.json({
      message: 'Campground deleted successfully',
    });
  } catch (error) {
    logError('Error deleting campground', error, { 
      endpoint: '/api/owners/campgrounds/:id',
      userId: req.user?._id,
      campgroundId: req.params.id 
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete campground',
    });
  }
};

/**
 * Get campground bookings
 * GET /api/owners/campgrounds/:id/bookings
 */
const getCampgroundBookings = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Verify ownership
    const campground = await Campground.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!campground) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campground not found or you do not have permission to access it',
      });
    }

    // Build query
    const query = { campground: campground._id };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate('user', 'username email phone')
      .populate('campsite', 'name type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logError('Error fetching campground bookings', error, { 
      endpoint: '/api/owners/campgrounds/:id/bookings',
      userId: req.user?._id,
      campgroundId: req.params.id 
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch bookings',
    });
  }
};

/**
 * Update booking status
 * PATCH /api/owners/campgrounds/:id/bookings/:bookingId
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id: campgroundId, bookingId } = req.params;

    // Verify ownership
    const campground = await Campground.findOne({
      _id: campgroundId,
      owner: req.user._id,
    });

    if (!campground) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campground not found or you do not have permission to access it',
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      campground: campgroundId,
    }).populate('user', 'username email');

    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found',
      });
    }

    booking.status = status;
    await booking.save();

    res.json({
      message: 'Booking status updated successfully',
      booking,
    });
  } catch (error) {
    logError('Error updating booking status', error, { 
      endpoint: '/api/owners/campgrounds/:campgroundId/bookings/:bookingId',
      userId: req.user?._id,
      campgroundId: req.params.campgroundId,
      bookingId: req.params.bookingId 
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update booking status',
    });
  }
};

module.exports = {
  getOwnerCampgrounds,
  createCampground,
  getOwnerCampground,
  updateCampground,
  deleteCampground,
  getCampgroundBookings,
  updateBookingStatus,
};
