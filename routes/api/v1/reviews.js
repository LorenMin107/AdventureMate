const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams: true allows us to access the params from the parent router
const reviews = require("../../../controllers/api/reviews");
const catchAsync = require("../../../utils/catchAsync");
const { validateReviewApi, isLoggedInApi, isReviewAuthorApi } = require("../../../middleware");

// Get all reviews for a campground
router.get("/", catchAsync(reviews.getReviews));

// Create a new review
router.post(
  "/", 
  isLoggedInApi, 
  validateReviewApi, 
  catchAsync(reviews.createReview)
);

// Delete a review
router.delete(
  "/:reviewId", 
  isLoggedInApi, 
  isReviewAuthorApi, 
  catchAsync(reviews.deleteReview)
);

module.exports = router;
