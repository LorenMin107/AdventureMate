const express = require('express');
const router = express.Router();
const authController = require('../../../controllers/api/auth');
const { authenticateJWT, requireAuth } = require('../../../middleware/jwtAuth');
const { validate } = require('../../../middleware/validators');
const { body } = require('express-validator');

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
router.post('/login', validate(loginValidation), authController.login);

// Refresh token route - returns a new access token
router.post('/refresh-token', validate(refreshTokenValidation), authController.refreshToken);

// Logout route - revokes the refresh token
router.post('/logout', validate(logoutValidation), authController.logout);

// Logout from all devices - revokes all refresh tokens for the user
router.post('/logout-all', authenticateJWT, requireAuth, authController.logoutAll);

module.exports = router;