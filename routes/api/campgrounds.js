const express = require("express");
const router = express.Router();
const campgrounds = require("../../controllers/api/campgrounds");
const catchAsync = require("../../utils/catchAsync");
const { isLoggedInApi, isAuthorApi, validateCampground, isAdminApi } = require("../../middleware");

const multer = require("multer");
const { storage } = require("../../cloudinary");
const upload = multer({ storage });

// Get all campgrounds
router.get("/", catchAsync(campgrounds.index));

// Search campgrounds
router.get("/search", catchAsync(campgrounds.searchCampgrounds));

// Create a new campground
router.post(
  "/", 
  isLoggedInApi, 
  isAdminApi, 
  upload.array("image"), 
  validateCampground, 
  catchAsync(campgrounds.createCampground)
);

// Get a specific campground
router.get("/:id", catchAsync(campgrounds.showCampground));

// Update a campground
router.put(
  "/:id", 
  isLoggedInApi, 
  isAuthorApi, 
  upload.array("image"), 
  validateCampground, 
  catchAsync(campgrounds.updateCampground)
);

// Delete a campground
router.delete(
  "/:id", 
  isLoggedInApi, 
  isAuthorApi, 
  catchAsync(campgrounds.deleteCampground)
);

module.exports = router;
