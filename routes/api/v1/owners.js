const express = require('express');
const router = express.Router();
const owners = require('../../../controllers/api/owners');
const ownerCampgrounds = require('../../../controllers/api/ownerCampgrounds');
const { authenticateJWT, requireAuth } = require('../../../middleware/jwtAuth');
const { isAdminApi } = require('../../../middleware');
const {
  requireOwner,
  requireVerifiedOwner,
  canManageCampgrounds,
  populateOwner,
} = require('../../../middleware/ownerAuth');

const multer = require('multer');
const { storage } = require('../../../cloudinary');
const upload = multer({ storage });

// Owner Application (for users to apply to become owners)
router.post('/apply', authenticateJWT, requireAuth, owners.applyToBeOwner);
router.get('/application', authenticateJWT, requireAuth, owners.getOwnerApplication);
router.put('/application', authenticateJWT, requireAuth, owners.updateOwnerApplication);

// Document Upload for Applications
router.post(
  '/application/documents',
  authenticateJWT,
  requireAuth,
  upload.array('documents', 10), // Allow up to 10 documents
  owners.uploadApplicationDocuments
);

// Owner Registration (for both users and admins)
router.post('/register', authenticateJWT, requireAuth, owners.registerOwner);
router.get('/profile', authenticateJWT, requireAuth, requireOwner, owners.getOwnerProfile);
router.put('/profile', authenticateJWT, requireAuth, requireOwner, owners.updateOwnerProfile);

// Document Upload for Verification
router.post(
  '/verification/documents',
  authenticateJWT,
  requireAuth,
  requireOwner,
  upload.array('documents', 10), // Allow up to 10 documents
  owners.uploadVerificationDocuments
);

// Owner Dashboard and Analytics
router.get('/dashboard', authenticateJWT, requireAuth, requireOwner, owners.getOwnerDashboard);
router.get('/analytics', authenticateJWT, requireAuth, requireOwner, owners.getOwnerAnalytics);
router.get('/bookings', authenticateJWT, requireAuth, requireOwner, owners.getOwnerBookings);
router.get('/bookings/:id', authenticateJWT, requireAuth, requireOwner, owners.getOwnerBooking);
router.patch(
  '/bookings/:id/status',
  authenticateJWT,
  requireAuth,
  requireOwner,
  owners.updateOwnerBookingStatus
);

// Owner Campground Management Routes
router.get(
  '/campgrounds',
  authenticateJWT,
  requireAuth,
  canManageCampgrounds,
  ownerCampgrounds.getOwnerCampgrounds
);
router.post(
  '/campgrounds',
  authenticateJWT,
  requireAuth,
  canManageCampgrounds,
  upload.array('images', 10),
  ownerCampgrounds.createCampground
);
router.get(
  '/campgrounds/:id',
  authenticateJWT,
  requireAuth,
  canManageCampgrounds,
  ownerCampgrounds.getOwnerCampground
);
router.put(
  '/campgrounds/:id',
  authenticateJWT,
  requireAuth,
  canManageCampgrounds,
  upload.array('images', 10),
  ownerCampgrounds.updateCampground
);
router.delete(
  '/campgrounds/:id',
  authenticateJWT,
  requireAuth,
  canManageCampgrounds,
  ownerCampgrounds.deleteCampground
);

// Owner Campground Booking Management
router.get(
  '/campgrounds/:id/bookings',
  authenticateJWT,
  requireAuth,
  canManageCampgrounds,
  ownerCampgrounds.getCampgroundBookings
);
router.patch(
  '/campgrounds/:id/bookings/:bookingId',
  authenticateJWT,
  requireAuth,
  canManageCampgrounds,
  ownerCampgrounds.updateBookingStatus
);

module.exports = router;
