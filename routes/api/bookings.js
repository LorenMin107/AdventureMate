const express = require("express");
const router = express.Router();

// Get all bookings for the current user
router.get("/", (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/bookings instead.",
    redirectTo: "/api/v1/bookings"
  });
});

// Get a specific booking
router.get("/:id", (req, res) => {
  const bookingId = req.params.id;
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/bookings/:id instead.",
    redirectTo: `/api/v1/bookings/${bookingId}`
  });
});

// Create a booking (initial step)
router.post("/:id/book", (req, res) => {
  const campgroundId = req.params.id;
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/bookings/:id/book instead.",
    redirectTo: `/api/v1/bookings/${campgroundId}/book`
  });
});

// Create a checkout session for payment
router.post("/:id/checkout", (req, res) => {
  const campgroundId = req.params.id;
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/bookings/:id/checkout instead.",
    redirectTo: `/api/v1/bookings/${campgroundId}/checkout`
  });
});

// Handle successful payment
router.get("/:id/success", (req, res) => {
  const campgroundId = req.params.id;
  // Forward query parameters
  const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/bookings/:id/success instead.",
    redirectTo: `/api/v1/bookings/${campgroundId}/success${queryString}`
  });
});

module.exports = router;
