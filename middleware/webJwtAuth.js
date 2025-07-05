const Campground = require('../models/campground');
const Review = require('../models/review');

/**
 * Middleware to check if user is an admin for web routes
 * This middleware should be used after authenticateJWT and requireAuth
 */
const isAdminJWT = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    req.flash("error", "You do not have permission to perform this action.");
    return res.redirect("/campgrounds");
  }
  next();
};

/**
 * Middleware to check if user is the author of a campground for web routes
 * This middleware should be used after authenticateJWT and requireAuth
 */
const isAuthorJWT = async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground) {
    req.flash("error", "Campground not found!");
    return res.redirect("/campgrounds");
  }
  if (!campground.author.equals(req.user._id) && !req.user.isAdmin) {
    req.flash("error", "You do not have permission to do that!");
    return res.redirect(`/campgrounds/${id}`);
  }
  next();
};

/**
 * Middleware to check if user is the author of a review for web routes
 * This middleware should be used after authenticateJWT and requireAuth
 */
const isReviewAuthorJWT = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review) {
    req.flash("error", "Review not found!");
    return res.redirect(`/campgrounds/${id}`);
  }
  if (!review.author.equals(req.user._id) && !req.user.isAdmin) {
    req.flash("error", "You do not have permission to do that!");
    return res.redirect(`/campgrounds/${id}`);
  }
  next();
};

module.exports = {
  isAdminJWT,
  isAuthorJWT,
  isReviewAuthorJWT
};