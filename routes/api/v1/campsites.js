const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams allows access to params from parent router
const campsites = require('../../../controllers/api/campsites');
const catchAsync = require('../../../utils/catchAsync');
const { isLoggedInApi, isAuthorApi, isAdminApi, isOwnerApi } = require('../../../middleware');
const { validate } = require('../../../middleware/validators');

const multer = require('multer');
const { storage } = require('../../../cloudinary');
const upload = multer({ storage });

// We'll need to create validators for campsites
// For now, we'll assume they're defined elsewhere
const campsiteValidators = {
  create: (req, res, next) => next(), // Placeholder
  show: (req, res, next) => next(), // Placeholder
  update: (req, res, next) => next(), // Placeholder
  delete: (req, res, next) => next(), // Placeholder
};

// Routes for /api/v1/campgrounds/:campgroundId/campsites
// Get all campsites for a campground
router.get('/', catchAsync(campsites.index));

// Create a new campsite
router.post(
  '/',
  isLoggedInApi,
  isOwnerApi,
  upload.array('image'),
  validate(campsiteValidators.create),
  catchAsync(campsites.createCampsite)
);

// Routes for /api/v1/campsites/:id
// Get a specific campsite
router.get('/:id', validate(campsiteValidators.show), catchAsync(campsites.showCampsite));

// Update a campsite
router.put(
  '/:id',
  isLoggedInApi,
  upload.array('image'),
  validate(campsiteValidators.update),
  catchAsync(campsites.updateCampsite)
);

// Delete a campsite
router.delete(
  '/:id',
  isLoggedInApi,
  validate(campsiteValidators.delete),
  catchAsync(campsites.deleteCampsite)
);

module.exports = router;
