const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const users = require('../../../controllers/api/users');
const catchAsync = require('../../../utils/catchAsync');
const {
  authenticateJWT,
  requireAuth,
  requireEmailVerified,
} = require('../../../middleware/jwtAuth');
const { validate } = require('../../../middleware/validators');
const { userValidators } = require('../../../middleware/validators');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Register a new user - handled by auth.js
// This route is kept for backward compatibility but redirects to the v1 auth endpoint
router.post('/register', (req, res) => {
  return res.status(308).json({
    message: 'This endpoint is deprecated. Please use /api/v1/auth/register instead.',
    redirectTo: '/api/v1/auth/register',
  });
});

// Login a user - handled by auth.js
// This route is kept for backward compatibility but redirects to the v1 auth endpoint
router.post('/login', (req, res) => {
  return res.status(308).json({
    message: 'This endpoint is deprecated. Please use /api/v1/auth/login instead.',
    redirectTo: '/api/v1/auth/login',
  });
});

// Logout a user - handled by auth.js
// This route is kept for backward compatibility but redirects to the v1 auth endpoint
router.post('/logout', (req, res) => {
  return res.status(308).json({
    message: 'This endpoint is deprecated. Please use /api/v1/auth/logout instead.',
    redirectTo: '/api/v1/auth/logout',
  });
});

// Check authentication status - handled by auth.js
// This route is kept for backward compatibility but redirects to the v1 auth endpoint
router.get('/status', (req, res) => {
  return res.status(308).json({
    message: 'This endpoint is deprecated. Please use /api/v1/auth/status instead.',
    redirectTo: '/api/v1/auth/status',
  });
});

// Get current user profile
router.get(
  '/profile',
  authenticateJWT,
  requireAuth,
  requireEmailVerified,
  catchAsync(users.getProfile)
);

// Update user profile
router.put(
  '/profile',
  authenticateJWT,
  requireAuth,
  requireEmailVerified,
  upload.single('profilePicture'),
  validate(userValidators.updateProfile),
  catchAsync(users.updateProfile)
);

// Upload profile picture
router.post(
  '/profile-picture',
  authenticateJWT,
  requireAuth,
  requireEmailVerified,
  upload.single('profilePicture'),
  catchAsync(users.uploadProfilePicture)
);

// Remove profile picture
router.delete(
  '/profile-picture',
  authenticateJWT,
  requireAuth,
  requireEmailVerified,
  catchAsync(users.removeProfilePicture)
);

// Submit a contact form
router.post(
  '/contact',
  authenticateJWT,
  requireAuth,
  requireEmailVerified,
  catchAsync(users.submitContact)
);

// Change password for authenticated user
router.put(
  '/change-password',
  authenticateJWT,
  requireAuth,
  requireEmailVerified,
  catchAsync(users.changePassword)
);

// Get user reviews
router.get(
  '/reviews',
  authenticateJWT,
  requireAuth,
  requireEmailVerified,
  catchAsync(users.getUserReviews)
);

// Password reset routes - handled by auth.js
// These routes are kept for backward compatibility but redirect to the v1 auth endpoints
router.post('/forgot-password', (req, res) => {
  return res.status(308).json({
    message: 'This endpoint is deprecated. Please use /api/v1/auth/forgot-password instead.',
    redirectTo: '/api/v1/auth/forgot-password',
  });
});

router.post('/reset-password', (req, res) => {
  return res.status(308).json({
    message: 'This endpoint is deprecated. Please use /api/v1/auth/reset-password instead.',
    redirectTo: '/api/v1/auth/reset-password',
  });
});

module.exports = router;
