const express = require("express");
const router = express.Router();

// Register a new user - handled by auth.js
router.post("/register", (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/auth/register instead.",
    redirectTo: "/api/v1/auth/register"
  });
});

// Login a user - handled by auth.js
router.post("/login", (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/auth/login instead.",
    redirectTo: "/api/v1/auth/login"
  });
});

// Logout a user - handled by auth.js
router.post("/logout", (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/auth/logout instead.",
    redirectTo: "/api/v1/auth/logout"
  });
});

// Check authentication status - handled by auth.js
router.get("/status", (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/auth/status instead.",
    redirectTo: "/api/v1/auth/status"
  });
});

// Get current user data
router.get("/profile", (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/users/profile instead.",
    redirectTo: "/api/v1/users/profile"
  });
});

// Update user profile
router.put("/profile", (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/users/profile instead.",
    redirectTo: "/api/v1/users/profile"
  });
});

// Submit a contact form
router.post("/contact", (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/users/contact instead.",
    redirectTo: "/api/v1/users/contact"
  });
});

// Get user reviews
router.get("/reviews", (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/users/reviews instead.",
    redirectTo: "/api/v1/users/reviews"
  });
});

// Password reset routes
// Request a password reset (public route)
router.post("/forgot-password", (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/auth/forgot-password instead.",
    redirectTo: "/api/v1/auth/forgot-password"
  });
});

// Reset password with token (public route)
router.post("/reset-password", (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/auth/reset-password instead.",
    redirectTo: "/api/v1/auth/reset-password"
  });
});

module.exports = router;
