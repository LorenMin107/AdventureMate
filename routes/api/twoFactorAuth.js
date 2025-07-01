const express = require('express');
const router = express.Router();
const twoFactorAuthController = require('../../controllers/api/twoFactorAuth');
const { isLoggedInApi } = require('../../middleware');
const catchAsync = require('../../utils/catchAsync');

/**
 * Legacy routes for two-factor authentication
 * These routes are deprecated and will be removed in a future version
 * Please use the versioned API routes at /api/v1/2fa instead
 */

// Initiate 2FA setup
router.post('/setup', isLoggedInApi, catchAsync(twoFactorAuthController.initiate2FASetup));

// Verify 2FA setup
router.post('/verify-setup', isLoggedInApi, catchAsync(twoFactorAuthController.verify2FASetup));

// Disable 2FA
router.post('/disable', isLoggedInApi, catchAsync(twoFactorAuthController.disable2FA));


// Verify 2FA during login
router.post('/verify-login', catchAsync(twoFactorAuthController.verify2FALogin));

module.exports = router;
