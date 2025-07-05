const express = require("express");
const router = express.Router();

// Get all campgrounds
router.get("/", (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/campgrounds instead.",
    redirectTo: "/api/v1/campgrounds"
  });
});

// Search campgrounds
router.get("/search", (req, res) => {
  // Forward query parameters
  const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/campgrounds/search instead.",
    redirectTo: `/api/v1/campgrounds/search${queryString}`
  });
});

// Create a new campground
router.post("/", (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/campgrounds instead.",
    redirectTo: "/api/v1/campgrounds"
  });
});

// Get a specific campground
router.get("/:id", (req, res) => {
  const campgroundId = req.params.id;
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/campgrounds/:id instead.",
    redirectTo: `/api/v1/campgrounds/${campgroundId}`
  });
});

// Update a campground
router.put("/:id", (req, res) => {
  const campgroundId = req.params.id;
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/campgrounds/:id instead.",
    redirectTo: `/api/v1/campgrounds/${campgroundId}`
  });
});

// Delete a campground
router.delete("/:id", (req, res) => {
  const campgroundId = req.params.id;
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/campgrounds/:id instead.",
    redirectTo: `/api/v1/campgrounds/${campgroundId}`
  });
});

module.exports = router;
