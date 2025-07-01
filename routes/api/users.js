const express = require("express");
const router = express.Router();
const users = require("../../controllers/api/users");
const catchAsync = require("../../utils/catchAsync");
const passport = require("passport");
const { isLoggedInApi } = require("../../middleware");
const { checkAccountLockout, handleFailedLogin, resetFailedAttempts, handleRememberMe } = require("../../middleware/accountSecurity");

// Register a new user
router.post("/register", catchAsync(users.register));

// Login a user
router.post(
  "/login",
  checkAccountLockout,
  passport.authenticate("local", { failWithError: true }),
  resetFailedAttempts,
  handleRememberMe,
  users.login,
  // Handle authentication errors
  (err, req, res, next) => {
    // Pass to failed login handler
    handleFailedLogin(req, res, (error) => {
      if (error) return next(error);
      return res.status(401).json({ error: "Invalid username or password" });
    });
  }
);

// Logout a user
router.post("/logout", users.logout);

// Check authentication status
router.get("/status", users.checkAuthStatus);

// Get current user data
router.get("/profile", isLoggedInApi, catchAsync(users.getUser));

// Update user profile
router.put("/profile", isLoggedInApi, catchAsync(users.updateProfile));

// Submit a contact form
router.post("/contact", isLoggedInApi, catchAsync(users.submitContact));

// Get user reviews
router.get("/reviews", isLoggedInApi, catchAsync(users.getUserReviews));

// Password reset routes
// Request a password reset (public route)
router.post("/forgot-password", catchAsync(users.requestPasswordReset));

// Reset password with token (public route)
router.post("/reset-password", catchAsync(users.resetPassword));

module.exports = router;
