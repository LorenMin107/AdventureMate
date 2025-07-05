const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams: true allows us to access the params from the parent router

// Get all reviews for a campground
router.get("/", (req, res) => {
  const campgroundId = req.params.id;
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/campgrounds/:id/reviews instead.",
    redirectTo: `/api/v1/campgrounds/${campgroundId}/reviews`
  });
});

// Create a new review
router.post("/", (req, res) => {
  const campgroundId = req.params.id;
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/campgrounds/:id/reviews instead.",
    redirectTo: `/api/v1/campgrounds/${campgroundId}/reviews`
  });
});

// Delete a review
router.delete("/:reviewId", (req, res) => {
  const campgroundId = req.params.id;
  const reviewId = req.params.reviewId;
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/campgrounds/:id/reviews/:reviewId instead.",
    redirectTo: `/api/v1/campgrounds/${campgroundId}/reviews/${reviewId}`
  });
});

module.exports = router;
