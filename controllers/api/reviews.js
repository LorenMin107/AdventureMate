const Campground = require('../../models/campground');
const Review = require('../../models/review');
const User = require('../../models/user');
const { logError, logInfo, logWarn, logDebug } = require('../../utils/logger');
const redisCache = require('../../utils/redis');

module.exports.createReview = async (req, res) => {
  try {
    const campground = await Campground.findById(req.params.id);

    if (!campground) {
      return res.status(404).json({ error: 'Campground not found' });
    }

    const review = new Review({
      body: req.body.body,
      rating: req.body.rating,
      author: req.user._id,
      campground: campground._id,
    });

    campground.reviews.push(review);
    await review.save();
    await campground.save();

    // Associate review with user
    req.user.reviews.push(review);
    await req.user.save();

    // Populate author information for the response
    const populatedReview = await Review.findById(review._id).populate('author');

    // Clear backend cache for this campground to ensure fresh data
    if (redisCache.isReady()) {
      const cacheKey = `campground:${req.params.id}`;
      await redisCache.del(cacheKey);
      logInfo('Cleared campground cache after creating review', { campgroundId: req.params.id });
    }

    res.status(201).json({
      review: populatedReview,
      message: 'Review created successfully',
    });
  } catch (error) {
    logError('Error creating review', error, {
      endpoint: '/api/v1/campgrounds/:id/reviews',
      userId: req.user?._id,
      campgroundId: req.params.id,
    });
    res.status(400).json({ error: error.message || 'Failed to create review' });
  }
};

module.exports.getReviews = async (req, res) => {
  try {
    const { id } = req.params;

    // First check if campground exists
    const campground = await Campground.findById(id);
    if (!campground) {
      return res.status(404).json({ error: 'Campground not found' });
    }

    // Directly query reviews by campground ID to avoid timing issues with MongoDB Atlas
    // This approach is more reliable and ensures we get all reviews including newly created ones
    const reviews = await Review.find({ campground: id })
      .populate('author', 'username')
      .sort({ _id: -1 }); // Sort by newest first

    logInfo('Retrieved reviews for campground', {
      campgroundId: id,
      reviewCount: reviews.length,
    });

    res.json({ reviews });
  } catch (error) {
    logError('Error fetching reviews', error, {
      endpoint: '/api/v1/campgrounds/:id/reviews',
      campgroundId: req.params.id,
    });
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

module.exports.deleteReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;

    logInfo('Attempting to delete review', {
      campgroundId: id,
      reviewId: reviewId,
      userId: req.user?._id,
    });

    // Check if campground exists
    const campground = await Campground.findById(id);
    if (!campground) {
      logWarn('Campground not found during review deletion', { campgroundId: id });
      return res.status(404).json({ error: 'Campground not found' });
    }

    // Check if review exists
    const review = await Review.findById(reviewId);
    if (!review) {
      logWarn('Review not found during deletion', { reviewId: reviewId, campgroundId: id });
      return res.status(404).json({ error: 'Review not found' });
    }

    // Remove review from campground
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

    // Remove review from any users
    await User.updateMany({ reviews: reviewId }, { $pull: { reviews: reviewId } });

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    // Clear backend cache for this campground to ensure fresh data
    if (redisCache.isReady()) {
      const cacheKey = `campground:${id}`;
      await redisCache.del(cacheKey);
      logInfo('Cleared campground cache after deleting review', { campgroundId: id });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    logError('Error deleting review', error, {
      endpoint: '/api/v1/reviews/:id',
      userId: req.user?._id,
      reviewId: req.params.id,
    });
    res.status(500).json({ error: 'Failed to delete review' });
  }
};
