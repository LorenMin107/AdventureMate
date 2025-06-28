const express = require("express");
const router = express.Router();
const campgrounds = require("../../controllers/api/campgrounds");
const { isLoggedInApi, isAuthorApi, isAdminApi } = require("../../middleware");
const { validate, campgroundValidators } = require("../../middleware/validators");

const multer = require("multer");
const { storage } = require("../../cloudinary");
const upload = multer({ storage });

// Get all campgrounds
router.get("/", campgrounds.index);

// Search campgrounds
router.get("/search", validate(campgroundValidators.search), campgrounds.searchCampgrounds);

// Create a new campground
router.post(
  "/", 
  isLoggedInApi, 
  isAdminApi, 
  upload.array("image"), 
  validate(campgroundValidators.create), 
  campgrounds.createCampground
);

// Get a specific campground
router.get("/:id", validate(campgroundValidators.show), campgrounds.showCampground);

// Update a campground
router.put(
  "/:id", 
  isLoggedInApi, 
  isAuthorApi, 
  upload.array("image"), 
  validate(campgroundValidators.update), 
  campgrounds.updateCampground
);

// Delete a campground
router.delete(
  "/:id", 
  isLoggedInApi, 
  isAuthorApi, 
  validate(campgroundValidators.delete),
  campgrounds.deleteCampground
);

module.exports = router;
