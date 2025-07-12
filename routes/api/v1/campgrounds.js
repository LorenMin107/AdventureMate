const express = require('express');
const router = express.Router();
const campgrounds = require('../../../controllers/api/campgrounds');
const catchAsync = require('../../../utils/catchAsync');
const { isLoggedInApi, isAuthorApi, isAdminApi } = require('../../../middleware');
const { validate, campgroundValidators } = require('../../../middleware/validators');

const multer = require('multer');
const { storage } = require('../../../cloudinary');
const upload = multer({ storage });

// Get all campgrounds
router.get('/', catchAsync(campgrounds.index));

// Search campgrounds
router.get(
  '/search',
  validate(campgroundValidators.search),
  catchAsync(campgrounds.searchCampgrounds)
);

// Get search suggestions/autocomplete
router.get(
  '/suggestions',
  validate(campgroundValidators.suggestions),
  catchAsync(campgrounds.getSearchSuggestions)
);

// Create a new campground
router.post(
  '/',
  isLoggedInApi,
  isAdminApi,
  upload.array('image'),
  validate(campgroundValidators.create),
  catchAsync(campgrounds.createCampground)
);

// Get a specific campground
router.get('/:id', validate(campgroundValidators.show), catchAsync(campgrounds.showCampground));

// Update a campground
router.put(
  '/:id',
  isLoggedInApi,
  isAuthorApi,
  upload.array('image'),
  validate(campgroundValidators.update),
  catchAsync(campgrounds.updateCampground)
);

// Delete a campground
router.delete(
  '/:id',
  isLoggedInApi,
  isAuthorApi,
  validate(campgroundValidators.delete),
  catchAsync(campgrounds.deleteCampground)
);

module.exports = router;
