const { campgroundSchema, reviewSchema } = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');
const Campground = require('./models/campground');
const Review = require('./models/review');
const User = require('./models/user');
const Booking = require('./models/booking');
const config = require('./config');
const { logDebug, logWarn, logInfo } = require('./utils/logger');

// API version of isLoggedIn middleware that returns JSON instead of redirecting
// Uses JWT-based authentication
module.exports.isLoggedInApi = (req, res, next) => {
  logDebug('isLoggedInApi middleware called', {
    userId: req.user?._id,
    isAuthenticated: !!req.user,
  });

  if (!req.user) {
    logWarn('User not authenticated, returning 401');
    return res.status(401).json({ error: 'You must be logged in to access this resource' });
  }

  logDebug('User authenticated, continuing to next middleware', { userId: req.user._id });
  next();
};

module.exports.validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(',');
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

// API version of isAuthor middleware that returns JSON instead of redirecting
module.exports.isAuthorApi = async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground) {
    return res.status(404).json({ error: 'Campground not found' });
  }
  if (!campground.author.equals(req.user._id) && !req.user.isAdmin) {
    return res.status(403).json({ error: 'You do not have permission to modify this campground' });
  }
  next();
};

// API version of isReviewAuthor middleware that returns JSON instead of redirecting
module.exports.isReviewAuthorApi = async (req, res, next) => {
  const { id, reviewId } = req.params;

  logInfo('isReviewAuthorApi middleware called', {
    campgroundId: id,
    reviewId: reviewId,
    userId: req.user?._id,
  });

  const review = await Review.findById(reviewId);
  if (!review) {
    logWarn('Review not found in isReviewAuthorApi', {
      reviewId: reviewId,
      campgroundId: id,
      userId: req.user?._id,
    });
    return res.status(404).json({ error: 'Review not found' });
  }

  logInfo('Review found in isReviewAuthorApi', {
    reviewId: reviewId,
    reviewAuthorId: review.author,
    userId: req.user?._id,
    isAdmin: req.user?.isAdmin,
  });

  if (!review.author.equals(req.user._id) && !req.user.isAdmin) {
    logWarn('User not authorized to delete review', {
      reviewId: reviewId,
      reviewAuthorId: review.author,
      userId: req.user?._id,
      isAdmin: req.user?.isAdmin,
    });
    return res.status(403).json({ error: 'You do not have permission to modify this review' });
  }

  logInfo('User authorized to delete review', {
    reviewId: reviewId,
    userId: req.user?._id,
  });

  next();
};

module.exports.validateBookingDates = async (req, res, next) => {
  const { startDate, endDate, campsiteId } = req.body;

  // Get tomorrow's date at midnight (start of day) for proper comparison
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // Convert input dates to Date objects for proper comparison
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  // Set time to start of day for consistent comparison
  startDateObj.setHours(0, 0, 0, 0);
  endDateObj.setHours(0, 0, 0, 0);

  if (startDateObj < tomorrow || endDateObj < tomorrow) {
    req.flash('error', 'Booking dates must be in the future.');
    return res.redirect(`/campgrounds/${req.params.id}`);
  }

  if (endDateObj < startDateObj) {
    req.flash('error', 'End date cannot be before start date.');
    return res.redirect(`/campgrounds/${req.params.id}`);
  }

  // If a specific campsite is selected, check if it's available for the requested dates
  if (campsiteId) {
    try {
      const Campsite = require('./models/campsite');
      const campsite = await Campsite.findById(campsiteId);

      if (!campsite) {
        req.flash('error', 'Campsite not found.');
        return res.redirect(`/campgrounds/${req.params.id}`);
      }

      // Check if the campsite is available for the requested dates
      if (!campsite.isAvailableForDates(startDate, endDate)) {
        req.flash(
          'error',
          'The selected campsite is already booked for these dates. Please choose different dates or a different campsite.'
        );
        return res.redirect(`/campgrounds/${req.params.id}`);
      }
    } catch (err) {
      logError('Error checking campsite availability', err);
      req.flash('error', 'Failed to check campsite availability.');
      return res.redirect(`/campgrounds/${req.params.id}`);
    }
  }

  next();
};

// API version of validateBookingDates middleware that returns JSON instead of redirecting
module.exports.validateBookingDatesApi = async (req, res, next) => {
  const { startDate, endDate, campsiteId } = req.body;

  // Get tomorrow's date at midnight (start of day) for proper comparison
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // Convert input dates to Date objects for proper comparison
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  // Set time to start of day for consistent comparison
  startDateObj.setHours(0, 0, 0, 0);
  endDateObj.setHours(0, 0, 0, 0);

  if (startDateObj < tomorrow || endDateObj < tomorrow) {
    return res.status(400).json({ error: 'Booking dates must be in the future' });
  }

  if (endDateObj < startDateObj) {
    return res.status(400).json({ error: 'End date cannot be before start date' });
  }

  // If a specific campsite is selected, check if it's available for the requested dates
  if (campsiteId) {
    try {
      const Campsite = require('./models/campsite');
      const campsite = await Campsite.findById(campsiteId);

      if (!campsite) {
        return res.status(404).json({ error: 'Campsite not found' });
      }

      // Check if the campsite is available for the requested dates
      if (!campsite.isAvailableForDates(startDate, endDate)) {
        return res.status(400).json({
          error: 'Campsite is not available for the selected dates',
          message:
            'The selected campsite is already booked for these dates. Please choose different dates or a different campsite.',
        });
      }
    } catch (err) {
      logError('Error checking campsite availability', err);
      return res.status(500).json({ error: 'Failed to check campsite availability' });
    }
  }

  next();
};

module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(',');
    req.flash('error', msg);
    return res.redirect(`/campgrounds/${req.params.id}`);
  } else {
    next();
  }
};

// API version of validateReview middleware that returns JSON instead of redirecting
module.exports.validateReviewApi = (req, res, next) => {
  // For API requests, we need to wrap the body and rating in a review object
  // to match the schema expectation
  const reviewData = {
    review: {
      body: req.body.body,
      rating: req.body.rating,
    },
  };

  const { error } = reviewSchema.validate(reviewData);
  if (error) {
    const msg = error.details.map((el) => el.message).join(',');
    return res.status(400).json({ error: msg });
  } else {
    next();
  }
};

// API version of isAdmin middleware that returns JSON instead of redirecting
// Uses JWT-based authentication
module.exports.isAdminApi = (req, res, next) => {
  logDebug('isAdminApi middleware called', {
    userId: req.user?._id,
    isAdmin: req.user?.isAdmin,
  });

  if (req.user && req.user.isAdmin) {
    logDebug('User is admin, continuing to next middleware', { userId: req.user._id });
    next();
  } else {
    logWarn('User is not admin, returning 403', { userId: req.user?._id });
    return res.status(403).json({ error: 'You do not have permission to perform this action' });
  }
};

module.exports.addBookingCountToUser = async (req, res, next) => {
  // Check if user is authenticated via JWT
  if (req.user) {
    // Count only active (non-cancelled) bookings
    const activeBookingsCount = await Booking.countDocuments({
      user: req.user._id,
      status: { $ne: 'cancelled' },
    });
    req.user.bookingsCount = activeBookingsCount;
  }
  next();
};

// Check if user is a campground owner (for API routes)
module.exports.isOwnerApi = async (req, res, next) => {
  const { id, campgroundId } = req.params;

  // Determine which ID to use (campgroundId for nested routes, id for direct routes)
  const campId = campgroundId || id;

  if (!campId) {
    return res.status(400).json({ error: 'Campground ID is required' });
  }

  const campground = await Campground.findById(campId);

  if (!campground) {
    return res.status(404).json({ error: 'Campground not found' });
  }

  // Check if user is the owner or an admin
  // First check the owner field, then fall back to author for backward compatibility
  const isOwner =
    (campground.owner && campground.owner.equals(req.user._id)) ||
    (campground.author && campground.author.equals(req.user._id));

  if (!isOwner && !req.user.isAdmin) {
    return res.status(403).json({
      error: 'You do not have permission to modify this campground',
      message: 'Only the campground owner or an admin can perform this action',
    });
  }

  // Add the campground to the request for potential use in route handlers
  req.campground = campground;
  next();
};
