const express = require("express");
const router = express.Router();
const admin = require("../../../controllers/api/admin");
const catchAsync = require("../../../utils/catchAsync");
const { authenticateJWT, requireAdmin } = require("../../../middleware/jwtAuth");
const { hasRole, hasPermission, auditLog } = require("../../../middleware/permissions");

// All routes in this file require authentication
router.use(authenticateJWT);

// Get dashboard statistics - requires admin role
router.get(
  "/dashboard", 
  hasRole(['admin']), 
  catchAsync(admin.getDashboardStats)
);

// Get all bookings (paginated) - requires permission to read all bookings
router.get(
  "/bookings", 
  hasPermission('read:all_bookings'), 
  catchAsync(admin.getBookings)
);

// Cancel a booking - requires permission to cancel any booking and audit logging
router.delete(
  "/bookings/:id", 
  hasPermission('cancel:any_booking'), 
  auditLog('cancel_booking', 'booking'), 
  catchAsync(admin.cancelBooking)
);

// Get all users (paginated) - requires permission to read all users
router.get(
  "/users", 
  hasPermission('read:all_users'), 
  catchAsync(admin.getAllUsers)
);

// Get user details - requires permission to read all users
router.get(
  "/users/:id", 
  hasPermission('read:all_users'), 
  catchAsync(admin.getUserDetails)
);

// Toggle user admin status - requires admin role and audit logging
router.patch(
  "/users/:id/toggle-admin", 
  hasRole(['admin']), 
  auditLog('toggle_admin', 'user', { includeBody: true }), 
  catchAsync(admin.toggleUserAdmin)
);

// Toggle user owner status - requires admin role and audit logging
router.patch(
  "/users/:id/toggle-owner", 
  hasRole(['admin']), 
  auditLog('toggle_owner', 'user', { includeBody: true }), 
  catchAsync(admin.toggleUserOwner)
);

// Owner Application Management - requires specific permissions and audit logging
router.get(
  "/owner-applications", 
  hasPermission('manage:owner_applications'), 
  catchAsync(admin.getOwnerApplications)
);

router.get(
  "/owner-applications/:id", 
  hasPermission('manage:owner_applications'), 
  catchAsync(admin.getOwnerApplicationDetails)
);

router.post(
  "/owner-applications/:id/approve", 
  hasPermission('manage:owner_applications'), 
  auditLog('approve_application', 'owner_application', { includeBody: true }), 
  catchAsync(admin.approveOwnerApplication)
);

router.post(
  "/owner-applications/:id/reject", 
  hasPermission('manage:owner_applications'), 
  auditLog('reject_application', 'owner_application', { includeBody: true }), 
  catchAsync(admin.rejectOwnerApplication)
);

router.post(
  "/owner-applications/:id/review", 
  hasPermission('manage:owner_applications'), 
  auditLog('review_application', 'owner_application', { includeBody: true }), 
  catchAsync(admin.updateApplicationReview)
);

// Owner Management - requires specific permissions and audit logging
router.get(
  "/owners", 
  hasPermission('read:all_users'), 
  catchAsync(admin.getAllOwners)
);

router.get(
  "/owners/:id", 
  hasPermission('read:all_users'), 
  catchAsync(admin.getOwnerDetails)
);

router.post(
  "/owners/:id/suspend", 
  hasPermission('update:any_user'), 
  auditLog('suspend_owner', 'owner', { includeBody: true }), 
  catchAsync(admin.suspendOwner)
);

router.post(
  "/owners/:id/reactivate", 
  hasPermission('update:any_user'), 
  auditLog('reactivate_owner', 'owner', { includeBody: true }), 
  catchAsync(admin.reactivateOwner)
);

router.post(
  "/owners/:id/verify", 
  hasPermission('update:any_user'), 
  auditLog('verify_owner', 'owner', { includeBody: true }), 
  catchAsync(admin.verifyOwner)
);

router.post(
  "/owners/:id/revoke", 
  hasPermission('update:any_user'), 
  auditLog('revoke_owner', 'owner', { includeBody: true }), 
  catchAsync(admin.revokeOwnerStatus)
);

module.exports = router;
