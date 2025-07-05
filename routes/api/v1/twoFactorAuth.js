const express = require('express');
const router = express.Router();
const twoFactorAuthController = require('../../../controllers/api/twoFactorAuth');
const { authenticateJWT, requireAuth } = require('../../../middleware/jwtAuth');
const { validate } = require('../../../middleware/validators');
const { body } = require('express-validator');
const { authLimiter } = require('../../../middleware/rateLimiter');

// Validation rules
const tokenValidation = [body('token').notEmpty().withMessage('Verification code is required')];

const backupCodeValidation = [
  body('token').notEmpty().withMessage('Backup code is required'),
  body('useBackupCode').isBoolean().withMessage('useBackupCode must be a boolean'),
];

// Routes that require authentication
router.post('/setup', authenticateJWT, requireAuth, twoFactorAuthController.initiate2FASetup);
router.post(
  '/verify-setup',
  authenticateJWT,
  requireAuth,
  validate(tokenValidation),
  twoFactorAuthController.verify2FASetup
);
router.post(
  '/disable',
  authenticateJWT,
  requireAuth,
  validate(tokenValidation),
  twoFactorAuthController.disable2FA
);

// Route for verifying 2FA during login (requires temporary JWT token)
router.post(
  '/verify-login',
  authLimiter,
  authenticateJWT,
  requireAuth,
  validate(backupCodeValidation),
  twoFactorAuthController.verify2FALogin
);

module.exports = router;
