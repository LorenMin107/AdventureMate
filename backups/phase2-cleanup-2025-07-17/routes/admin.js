const express = require("express");
const router = express.Router();
const { authenticateJWT, requireAuth } = require("../middleware/jwtAuth");
const { isAdminJWT } = require("../middleware/webJwtAuth");
const adminController = require("../controllers/admin");

router.get("/dashboard", authenticateJWT, requireAuth, isAdminJWT, adminController.adminDashboard);
router.delete("/bookings/:id", authenticateJWT, requireAuth, isAdminJWT, adminController.cancelBooking);
router.get("/users", authenticateJWT, requireAuth, isAdminJWT, adminController.viewAllUsers);
router.get("/users/:id", authenticateJWT, requireAuth, isAdminJWT, adminController.viewUserDetails);
module.exports = router;
