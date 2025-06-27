const express = require("express");
const router = express.Router();
const users = require("../../../controllers/api/users");
const catchAsync = require("../../../utils/catchAsync");
const passport = require("passport");
const { isLoggedInApi } = require("../../../middleware");

// Register a new user
router.post("/register", catchAsync(users.register));

// Login a user
router.post(
  "/login",
  passport.authenticate("local", { failWithError: true }),
  users.login,
  // Handle authentication errors
  (err, req, res, next) => {
    return res.status(401).json({ error: "Invalid username or password" });
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

module.exports = router;
