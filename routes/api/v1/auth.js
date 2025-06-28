const express = require('express');
const router = express.Router();
const authController = require('../../../controllers/api/auth');
const { authenticateJWT, requireAuth } = require('../../../middleware/jwtAuth');
const { validate } = require('../../../middleware/validators');
const { body } = require('express-validator');
const { 
  authLimiter, 
  emailVerificationLimiter, 
  resendVerificationLimiter 
} = require('../../../middleware/rateLimiter');

// Validation rules
const loginValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const refreshTokenValidation = [
  body('token').notEmpty().withMessage('Refresh token is required')
];

const logoutValidation = [
  body('token').notEmpty().withMessage('Refresh token is required')
];

// Login route - returns JWT access and refresh tokens
router.post('/login', authLimiter, validate(loginValidation), authController.login);

// Refresh token route - returns a new access token
router.post('/refresh-token', authLimiter, validate(refreshTokenValidation), authController.refreshToken);

// Logout route - revokes the refresh token
router.post('/logout', authLimiter, validate(logoutValidation), authController.logout);

// Logout from all devices - revokes all refresh tokens for the user
router.post('/logout-all', authenticateJWT, requireAuth, authController.logoutAll);

// Email verification routes
router.get('/verify-email', emailVerificationLimiter, authController.verifyEmail);
router.post('/resend-verification-email', resendVerificationLimiter, authenticateJWT, requireAuth, authController.resendVerificationEmail);

module.exports = router;
