const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams allows access to params from parent router
const safetyAlerts = require('../../../controllers/api/safetyAlerts');
const catchAsync = require('../../../utils/catchAsync');
const { authenticateJWT, requireAuth } = require('../../../middleware/jwtAuth');
const { isLoggedInApi, isAuthorApi, isAdminApi } = require('../../../middleware');

// Get all safety alerts for a campground (public)
router.get('/', catchAsync(safetyAlerts.getSafetyAlerts));

// Get active safety alerts for a campground (public)
router.get('/active', catchAsync(safetyAlerts.getActiveSafetyAlerts));

// Get a specific safety alert (public, but visibility controlled by model)
router.get('/:alertId', catchAsync(safetyAlerts.getSafetyAlert));

// Routes that require authentication
router.use(authenticateJWT);
router.use(requireAuth);

// Create a new safety alert (campground owners and admins only)
router.post('/', catchAsync(safetyAlerts.createSafetyAlert));

// Update a safety alert (creator, campground owners, and admins only)
router.put('/:alertId', catchAsync(safetyAlerts.updateSafetyAlert));

// Delete a safety alert (creator, campground owners, and admins only)
router.delete('/:alertId', catchAsync(safetyAlerts.deleteSafetyAlert));

// Acknowledge a safety alert (authenticated users)
router.post('/:alertId/acknowledge', catchAsync(safetyAlerts.acknowledgeSafetyAlert));

module.exports = router;
