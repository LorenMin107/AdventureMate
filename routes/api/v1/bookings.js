const express = require('express');
const router = express.Router();
const bookings = require('../../../controllers/api/bookings');
const catchAsync = require('../../../utils/catchAsync');
const { isLoggedInApi, validateBookingDatesApi } = require('../../../middleware');
const { requireEmailVerified } = require('../../../middleware/jwtAuth');

// Get all bookings for the current user
router.get('/', isLoggedInApi, requireEmailVerified, catchAsync(bookings.getBookings));

// Get a specific booking
router.get('/:id', isLoggedInApi, requireEmailVerified, catchAsync(bookings.getBooking));

// Create a booking (initial step)
router.post(
  '/:id/book',
  isLoggedInApi,
  requireEmailVerified,
  validateBookingDatesApi,
  catchAsync(bookings.createBooking)
);

// Create a checkout session for payment
router.post(
  '/:id/checkout',
  isLoggedInApi,
  requireEmailVerified,
  validateBookingDatesApi,
  catchAsync(bookings.createCheckoutSession)
);

// Handle successful payment
router.get(
  '/:id/success',
  isLoggedInApi,
  requireEmailVerified,
  catchAsync(bookings.handlePaymentSuccess)
);

// Cancel a booking (user can only cancel their own bookings)
router.patch(
  '/:id/cancel',
  isLoggedInApi,
  requireEmailVerified,
  catchAsync(bookings.cancelBooking)
);

module.exports = router;
