const express = require('express');
const router = express.Router();

/**
 * Legacy routes for two-factor authentication
 * These routes are deprecated and will be removed in a future version
 * Please use the versioned API routes at /api/v1/2fa instead
 */

// Initiate 2FA setup
router.post('/setup', (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/2fa/setup instead.",
    redirectTo: "/api/v1/2fa/setup"
  });
});

// Verify 2FA setup
router.post('/verify-setup', (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/2fa/verify-setup instead.",
    redirectTo: "/api/v1/2fa/verify-setup"
  });
});

// Disable 2FA
router.post('/disable', (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/2fa/disable instead.",
    redirectTo: "/api/v1/2fa/disable"
  });
});

// Verify 2FA during login
router.post('/verify-login', (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/2fa/verify-login instead.",
    redirectTo: "/api/v1/2fa/verify-login"
  });
});

module.exports = router;
