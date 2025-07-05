const Campground = require("../../models/campground");
const Review = require("../../models/review");
const User = require("../../models/user");
const { logError, logInfo, logWarn, logDebug } = require('../../utils/logger');

module.exports.createReview = async (req, res) => {
  try {
    const campground = await Campground.findById(req.params.id);

    if (!campground) {
      return res.status(404).json({ error: "Campground not found" });
    }

    const review = new Review({
      body: req.body.body,
      rating: req.body.rating,
      author: req.user._id,
      campground: campground._id
    });

    campground.reviews.push(review);
    await review.save();
    await campground.save();

    // Associate review with user
    req.user.reviews.push(review);
    await req.user.save();

    // Populate author information for the response
    const populatedReview = await Review.findById(review._id).populate('author');

    res.status(201).json({ 
      review: populatedReview, 
      message: "Review created successfully" 
    });
  } catch (error) {
    logError("Error creating review", error, { 
      endpoint: "/api/v1/campgrounds/:id/reviews",
      userId: req.user?._id,
      campgroundId: req.params.id 
    });
    res.status(400).json({ error: error.message || "Failed to create review" });
  }
};

module.exports.getReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const campground = await Campground.findById(id).populate({
      path: 'reviews',
      populate: { path: 'author' }
    });

    if (!campground) {
      return res.status(404).json({ error: "Campground not found" });
    }

    res.json({ reviews: campground.reviews });
  } catch (error) {
    logError("Error fetching reviews", error, { 
      endpoint: "/api/v1/campgrounds/:id/reviews",
      campgroundId: req.params.id 
    });
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

module.exports.deleteReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;

    // Check if campground exists
    const campground = await Campground.findById(id);
    if (!campground) {
      return res.status(404).json({ error: "Campground not found" });
    }

    // Check if review exists
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Remove review from campground
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

    // Remove review from any users
    await User.updateMany({ reviews: reviewId }, { $pull: { reviews: reviewId } });

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    logError("Error deleting review", error, { 
      endpoint: "/api/v1/reviews/:id",
      userId: req.user?._id,
      reviewId: req.params.id 
    });
    res.status(500).json({ error: "Failed to delete review" });
  }
};
