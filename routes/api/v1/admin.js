const express = require('express');
const router = express.Router();
const admin = require('../../../controllers/api/admin');
const catchAsync = require('../../../utils/catchAsync');
const { authenticateJWT, requireAdmin } = require('../../../middleware/jwtAuth');
const { hasRole, hasPermission, auditLog } = require('../../../middleware/permissions');
const redisCache = require('../../../utils/redis');
const ApiResponse = require('../../../utils/ApiResponse');
const { asyncHandler } = require('../../../utils/errorHandler');
const { logInfo, logWarn } = require('../../../utils/logger');

// All routes in this file require authentication
router.use(authenticateJWT);
router.use(requireAdmin);

// Get dashboard statistics - requires admin role
router.get('/dashboard', hasRole(['admin']), catchAsync(admin.getDashboardStats));

// Get all bookings (paginated) - requires permission to read all bookings
router.get('/bookings', hasPermission('read:all_bookings'), catchAsync(admin.getBookings));

// Cancel a booking - requires permission to cancel any booking and audit logging
router.delete(
  '/bookings/:id',
  hasPermission('cancel:any_booking'),
  auditLog('cancel_booking', 'booking'),
  catchAsync(admin.cancelBooking)
);

// Get all users (paginated) - requires permission to read all users
router.get('/users', hasPermission('read:all_users'), catchAsync(admin.getAllUsers));

// Get user details - requires permission to read all users
router.get('/users/:id', hasPermission('read:all_users'), catchAsync(admin.getUserDetails));

// Toggle user admin status - requires admin role and audit logging
router.patch(
  '/users/:id/toggle-admin',
  hasRole(['admin']),
  auditLog('toggle_admin', 'user', { includeBody: true }),
  catchAsync(admin.toggleUserAdmin)
);

// Toggle user owner status - requires admin role and audit logging
router.patch(
  '/users/:id/toggle-owner',
  hasRole(['admin']),
  auditLog('toggle_owner', 'user', { includeBody: true }),
  catchAsync(admin.toggleUserOwner)
);

// Owner Application Management - requires specific permissions and audit logging
router.get(
  '/owner-applications',
  hasPermission('manage:owner_applications'),
  catchAsync(admin.getOwnerApplications)
);

router.get(
  '/owner-applications/:id',
  hasPermission('manage:owner_applications'),
  catchAsync(admin.getOwnerApplicationDetails)
);

router.post(
  '/owner-applications/:id/approve',
  hasPermission('manage:owner_applications'),
  auditLog('approve_application', 'owner_application', { includeBody: true }),
  catchAsync(admin.approveOwnerApplication)
);

router.post(
  '/owner-applications/:id/reject',
  hasPermission('manage:owner_applications'),
  auditLog('reject_application', 'owner_application', { includeBody: true }),
  catchAsync(admin.rejectOwnerApplication)
);

router.post(
  '/owner-applications/:id/review',
  hasPermission('manage:owner_applications'),
  auditLog('review_application', 'owner_application', { includeBody: true }),
  catchAsync(admin.updateApplicationReview)
);

// Owner Management - requires specific permissions and audit logging
router.get('/owners', hasPermission('read:all_users'), catchAsync(admin.getAllOwners));

router.get('/owners/:id', hasPermission('read:all_users'), catchAsync(admin.getOwnerDetails));

router.post(
  '/owners/:id/suspend',
  hasPermission('update:any_user'),
  auditLog('suspend_owner', 'owner', { includeBody: true }),
  catchAsync(admin.suspendOwner)
);

router.post(
  '/owners/:id/reactivate',
  hasPermission('update:any_user'),
  auditLog('reactivate_owner', 'owner', { includeBody: true }),
  catchAsync(admin.reactivateOwner)
);

router.post(
  '/owners/:id/verify',
  hasPermission('update:any_user'),
  auditLog('verify_owner', 'owner', { includeBody: true }),
  catchAsync(admin.verifyOwner)
);

router.post(
  '/owners/:id/revoke',
  hasPermission('update:any_user'),
  auditLog('revoke_owner', 'owner', { includeBody: true }),
  catchAsync(admin.revokeOwnerStatus)
);

/**
 * @route GET /api/v1/admin/cache/stats
 * @desc Get Redis cache statistics
 * @access Admin only
 */
router.get(
  '/cache/stats',
  asyncHandler(async (req, res) => {
    const stats = await redisCache.getStats();

    if (!stats) {
      return ApiResponse.error(
        'Cache not available',
        'Redis cache is not connected or available',
        503
      ).send(res);
    }

    return ApiResponse.success(stats, 'Cache statistics retrieved successfully').send(res);
  })
);

/**
 * @route POST /api/v1/admin/cache/clear
 * @desc Clear all cache
 * @access Admin only
 */
router.post(
  '/cache/clear',
  asyncHandler(async (req, res) => {
    const success = await redisCache.clearAll();

    if (!success) {
      return ApiResponse.error(
        'Cache clear failed',
        'Failed to clear cache - Redis may not be connected',
        503
      ).send(res);
    }

    logInfo('Admin cleared all cache', { adminId: req.user._id });

    return ApiResponse.success(null, 'Cache cleared successfully').send(res);
  })
);

/**
 * @route POST /api/v1/admin/cache/invalidate
 * @desc Invalidate cache by pattern
 * @access Admin only
 */
router.post(
  '/cache/invalidate',
  asyncHandler(async (req, res) => {
    const { pattern } = req.body;

    if (!pattern) {
      return ApiResponse.error(
        'Pattern required',
        'Cache pattern is required for invalidation',
        400
      ).send(res);
    }

    const success = await redisCache.invalidatePattern(pattern);

    if (!success) {
      return ApiResponse.error(
        'Cache invalidation failed',
        'Failed to invalidate cache - Redis may not be connected',
        503
      ).send(res);
    }

    logInfo('Admin invalidated cache pattern', {
      adminId: req.user._id,
      pattern,
    });

    return ApiResponse.success(null, `Cache pattern "${pattern}" invalidated successfully`).send(
      res
    );
  })
);

/**
 * @route GET /api/v1/admin/cache/status
 * @desc Get cache connection status
 * @access Admin only
 */
router.get(
  '/cache/status',
  asyncHandler(async (req, res) => {
    const status = {
      isConnected: redisCache.isReady(),
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      db: process.env.REDIS_DB || 0,
    };

    return ApiResponse.success(status, 'Cache status retrieved successfully').send(res);
  })
);

module.exports = router;
