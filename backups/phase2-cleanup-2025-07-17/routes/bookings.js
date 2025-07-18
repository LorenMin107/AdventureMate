const express = require("express");
const router = express.Router();
const { validateBookingDates, addBookingCountToUser } = require("../middleware");
const { authenticateJWT, requireAuth } = require("../middleware/jwtAuth");
const bookings = require("../controllers/bookings");

// Define all route handlers directly to avoid undefined function issues
router.get("/view", authenticateJWT, requireAuth, addBookingCountToUser, async (req, res) => {
  // Call the viewBooking function directly
  return bookings.viewBooking(req, res);
});

router.post("/:id/book", authenticateJWT, requireAuth, validateBookingDates, async (req, res) => {
  // Call the bookCampground function directly
  return bookings.bookCampground(req, res);
});

router.get("/:id/checkout", authenticateJWT, requireAuth, validateBookingDates, async (req, res) => {
  // Call the renderCheckoutPage function directly
  return bookings.renderCheckoutPage(req, res);
});

router.post("/:id/proceed", authenticateJWT, requireAuth, validateBookingDates, addBookingCountToUser, async (req, res) => {
  // Call the proceedBooking function directly
  return bookings.proceedBooking(req, res);
});

router.get("/:id/pay", authenticateJWT, requireAuth, validateBookingDates, async (req, res) => {
  // Call the processPayment function directly
  return bookings.processPayment(req, res);
});

router.get("/:id/success", authenticateJWT, requireAuth, async (req, res) => {
  // Call the paymentSuccess function directly
  return bookings.paymentSuccess(req, res);
});

router.get("/:id/transaction", authenticateJWT, requireAuth, async (req, res) => {
  // Call the viewTransaction function directly
  return bookings.viewTransaction(req, res);
});

module.exports = router;
