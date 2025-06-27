const { campgroundSchema, reviewSchema } = require("./schemas.js");
const ExpressError = require("./utils/ExpressError");
const Campground = require("./models/campground");
const Review = require("./models/review");
const User = require("./models/user");
const Booking = require("./models/booking");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl; // store the returnTo path in the session
    req.flash("error", "You must be signed in to create a new campground.");
    return res.redirect("/login");
  }
  next();
};

// API version of isLoggedIn middleware that returns JSON instead of redirecting
module.exports.isLoggedInApi = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "You must be logged in to access this resource" });
  }
  next();
};

// storeReturnTo middleware to store the returnTo path in the session
module.exports.storeReturnTo = (req, res, next) => {
  if (req.session.returnTo) {
    res.locals.returnTo = req.session.returnTo;
  }
  next();
};

module.exports.validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

module.exports.isAuthor = async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground || (!campground.author.equals(req.user._id) && !req.user.isAdmin)) {
    req.flash("error", "You do not have permission to do that!");
    return res.redirect(`/campgrounds/${id}`);
  }
  next();
};

// API version of isAuthor middleware that returns JSON instead of redirecting
module.exports.isAuthorApi = async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground) {
    return res.status(404).json({ error: "Campground not found" });
  }
  if (!campground.author.equals(req.user._id) && !req.user.isAdmin) {
    return res.status(403).json({ error: "You do not have permission to modify this campground" });
  }
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review || (!review.author.equals(req.user._id) && !req.user.isAdmin)) {
    req.flash("error", "You do not have permission to do that!");
    return res.redirect(`/campgrounds/${id}`);
  }
  next();
};

// API version of isReviewAuthor middleware that returns JSON instead of redirecting
module.exports.isReviewAuthorApi = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json({ error: "Review not found" });
  }
  if (!review.author.equals(req.user._id) && !req.user.isAdmin) {
    return res.status(403).json({ error: "You do not have permission to modify this review" });
  }
  next();
};

module.exports.validateBookingDates = (req, res, next) => {
  const { startDate, endDate } = req.body;
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  if (startDate < tomorrow || endDate < tomorrow) {
    req.flash("error", "Booking dates must be in the future.");
    return res.redirect(`/campgrounds/${req.params.id}`);
  }

  if (new Date(endDate) < new Date(startDate)) {
    req.flash("error", "End date cannot be before start date.");
    return res.redirect(`/campgrounds/${req.params.id}`);
  }

  next();
};

// API version of validateBookingDates middleware that returns JSON instead of redirecting
module.exports.validateBookingDatesApi = (req, res, next) => {
  const { startDate, endDate } = req.body;
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  if (startDate < tomorrow || endDate < tomorrow) {
    return res.status(400).json({ error: "Booking dates must be in the future" });
  }

  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ error: "End date cannot be before start date" });
  }

  next();
};

module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    req.flash("error", msg);
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
      rating: req.body.rating
    }
  };

  const { error } = reviewSchema.validate(reviewData);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    return res.status(400).json({ error: msg });
  } else {
    next();
  }
};

module.exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    req.flash("error", "You do not have permission to perform this action.");
    return res.redirect("/campgrounds");
  }
};

// API version of isAdmin middleware that returns JSON instead of redirecting
module.exports.isAdminApi = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }
};

module.exports.addBookingCountToUser = async (req, res, next) => {
  if (req.isAuthenticated()) {
    // Count only active (non-cancelled) bookings
    const activeBookingsCount = await Booking.countDocuments({
      user: req.user._id,
      status: { $ne: 'cancelled' }
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
    return res.status(400).json({ error: "Campground ID is required" });
  }

  const campground = await Campground.findById(campId);

  if (!campground) {
    return res.status(404).json({ error: "Campground not found" });
  }

  // Check if user is the owner or an admin
  // First check the owner field, then fall back to author for backward compatibility
  const isOwner = (campground.owner && campground.owner.equals(req.user._id)) || 
                 (campground.author && campground.author.equals(req.user._id));

  if (!isOwner && !req.user.isAdmin) {
    return res.status(403).json({ 
      error: "You do not have permission to modify this campground",
      message: "Only the campground owner or an admin can perform this action"
    });
  }

  // Add the campground to the request for potential use in route handlers
  req.campground = campground;
  next();
};
