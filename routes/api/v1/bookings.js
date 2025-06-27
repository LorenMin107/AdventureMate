const express = require("express");
const router = express.Router();
const bookings = require("../../../controllers/api/bookings");
const catchAsync = require("../../../utils/catchAsync");
const { isLoggedInApi, validateBookingDatesApi } = require("../../../middleware");

// Get all bookings for the current user
router.get("/", isLoggedInApi, catchAsync(bookings.getBookings));

// Get a specific booking
router.get("/:id", isLoggedInApi, catchAsync(bookings.getBooking));

// Create a booking (initial step)
router.post(
  "/:id/book", 
  isLoggedInApi, 
  validateBookingDatesApi, 
  catchAsync(bookings.createBooking)
);

// Create a checkout session for payment
router.post(
  "/:id/checkout", 
  isLoggedInApi, 
  validateBookingDatesApi, 
  catchAsync(bookings.createCheckoutSession)
);

// Handle successful payment
router.get(
  "/:id/success", 
  isLoggedInApi, 
  catchAsync(bookings.handlePaymentSuccess)
);

module.exports = router;
