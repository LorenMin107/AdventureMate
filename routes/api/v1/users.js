const express = require('express');
const router = express.Router();
const users = require('../../../controllers/api/users');
const catchAsync = require('../../../utils/catchAsync');
const {
  authenticateJWT,
  requireAuth,
  requireEmailVerified,
} = require('../../../middleware/jwtAuth');

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

// Get current user data
router.get(
  '/profile',
  authenticateJWT,
  requireAuth,
  requireEmailVerified,
  catchAsync(users.getUser)
);

// Update user profile
router.put(
  '/profile',
  authenticateJWT,
  requireAuth,
  requireEmailVerified,
  catchAsync(users.updateProfile)
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
