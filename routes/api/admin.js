const express = require("express");
const router = express.Router();
const admin = require("../../controllers/api/admin");
const catchAsync = require("../../utils/catchAsync");
const { isLoggedInApi, isAdminApi } = require("../../middleware");

// All routes in this file require both authentication and admin privileges
router.use(isLoggedInApi, isAdminApi);

// Get dashboard statistics
router.get("/dashboard", catchAsync(admin.getDashboardStats));

// Get all bookings (paginated)
router.get("/bookings", catchAsync(admin.getBookings));

// Cancel a booking
router.delete("/bookings/:id", catchAsync(admin.cancelBooking));

// Get all users (paginated)
router.get("/users", catchAsync(admin.getAllUsers));

// Get user details
router.get("/users/:id", catchAsync(admin.getUserDetails));

module.exports = router;
