const express = require("express");
const router = express.Router();

// Get dashboard statistics
router.get("/dashboard", (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/admin/dashboard instead.",
    redirectTo: "/api/v1/admin/dashboard"
  });
});

// Get all bookings (paginated)
router.get("/bookings", (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/admin/bookings instead.",
    redirectTo: "/api/v1/admin/bookings"
  });
});

// Cancel a booking
router.delete("/bookings/:id", (req, res) => {
  const bookingId = req.params.id;
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/admin/bookings/:id instead.",
    redirectTo: `/api/v1/admin/bookings/${bookingId}`
  });
});

// Get all users (paginated)
router.get("/users", (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/admin/users instead.",
    redirectTo: "/api/v1/admin/users"
  });
});

// Get user details
router.get("/users/:id", (req, res) => {
  const userId = req.params.id;
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/admin/users/:id instead.",
    redirectTo: `/api/v1/admin/users/${userId}`
  });
});

// Toggle user admin status
router.patch("/users/:id/toggle-admin", (req, res) => {
  const userId = req.params.id;
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/admin/users/:id/toggle-admin instead.",
    redirectTo: `/api/v1/admin/users/${userId}/toggle-admin`
  });
});

// Toggle user owner status
router.patch("/users/:id/toggle-owner", (req, res) => {
  const userId = req.params.id;
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/admin/users/:id/toggle-owner instead.",
    redirectTo: `/api/v1/admin/users/${userId}/toggle-owner`
  });
});

module.exports = router;
