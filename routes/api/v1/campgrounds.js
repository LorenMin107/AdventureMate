const express = require('express');
const router = express.Router();
const campgrounds = require('../../../controllers/api/campgrounds');
const catchAsync = require('../../../utils/catchAsync');
const { isLoggedInApi, isAuthorApi, isAdminApi } = require('../../../middleware');
const { validate, campgroundValidators } = require('../../../middleware/validators');

const multer = require('multer');
const { storage } = require('../../../cloudinary');
const upload = multer({ storage });

// Get all campgrounds (public)
router.get('/', catchAsync(campgrounds.index));

// Search campgrounds (public)
router.get(
  '/search',
  validate(campgroundValidators.search),
  catchAsync(campgrounds.searchCampgrounds)
);

// Get search suggestions/autocomplete (public)
router.get(
  '/suggestions',
  validate(campgroundValidators.suggestions),
  catchAsync(campgrounds.getSearchSuggestions)
);

// Get a specific campground (public)
router.get('/:id', validate(campgroundValidators.show), catchAsync(campgrounds.showCampground));

// Create a new campground (requires authentication)
router.post(
  '/',
  isLoggedInApi,
  isAdminApi,
  upload.array('image'),
  validate(campgroundValidators.create),
  catchAsync(campgrounds.createCampground)
);

// Update a campground (requires authentication)
router.put(
  '/:id',
  isLoggedInApi,
  isAuthorApi,
  upload.array('image'),
  validate(campgroundValidators.update),
  catchAsync(campgrounds.updateCampground)
);

// Delete a campground (requires authentication)
router.delete(
  '/:id',
  isLoggedInApi,
  isAuthorApi,
  validate(campgroundValidators.delete),
  catchAsync(campgrounds.deleteCampground)
);

module.exports = router;
