const express = require('express');
const router = express.Router();
const authController = require('../../../controllers/api/auth');
const { authenticateJWT, requireAuth } = require('../../../middleware/jwtAuth');
const { validate } = require('../../../middleware/validators');
const { body } = require('express-validator');
const {
  authLimiter,
  emailVerificationLimiter,
  resendVerificationLimiter,
  passwordResetLimiter,
  authStatusLimiter,
} = require('../../../middleware/rateLimiter');

// Validation rules
const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

const refreshTokenValidation = [body('token').notEmpty().withMessage('Refresh token is required')];

const logoutValidation = [body('token').notEmpty().withMessage('Refresh token is required')];

const forgotPasswordValidation = [body('email').isEmail().withMessage('Valid email is required')];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
];

const registerValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
];

const socialAuthValidation = [
  body('code').notEmpty().withMessage('Authorization code is required'),
  body('redirectUri').notEmpty().withMessage('Redirect URI is required'),
];

// Register route - creates a new user and sends verification email
router.post('/register', authLimiter, validate(registerValidation), authController.register);

// Login route - returns JWT access and refresh tokens
router.post('/login', authLimiter, validate(loginValidation), authController.login);

// Refresh token route - returns a new access token
router.post(
  '/refresh-token',
  authLimiter,
  validate(refreshTokenValidation),
  authController.refreshToken
);

// Logout route - revokes the refresh token
router.post('/logout', authLimiter, validate(logoutValidation), authController.logout);

// Logout from all devices - revokes all refresh tokens for the user
router.post('/logout-all', authenticateJWT, requireAuth, authController.logoutAll);

// Email verification routes
router.get('/verify-email', emailVerificationLimiter, authController.verifyEmail);
router.post(
  '/resend-verification-email',
  resendVerificationLimiter,
  authenticateJWT,
  requireAuth,
  authController.resendVerificationEmail
);

// Password reset routes
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordValidation),
  authController.requestPasswordReset
);
router.post(
  '/reset-password',
  passwordResetLimiter,
  validate(resetPasswordValidation),
  authController.resetPassword
);

// Check authentication status
router.get('/status', authStatusLimiter, authenticateJWT, authController.checkAuthStatus);

// Social login routes
router.post('/google', authLimiter, validate(socialAuthValidation), authController.googleAuth);

module.exports = router;
