const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateJWT } = require('../../../middleware/jwtAuth');
const campsiteSafetyAlerts = require('../../../controllers/api/campsiteSafetyAlerts');

// Campsite safety alerts routes
router.get(
  '/:campsiteId/safety-alerts',
  authenticateJWT,
  campsiteSafetyAlerts.getCampsiteSafetyAlerts
);
router.get(
  '/:campsiteId/safety-alerts/active',
  authenticateJWT,
  campsiteSafetyAlerts.getCampsiteActiveSafetyAlerts
);
router.post(
  '/:campsiteId/safety-alerts',
  authenticateJWT,
  campsiteSafetyAlerts.createCampsiteSafetyAlert
);
router.put(
  '/:campsiteId/safety-alerts/:alertId',
  authenticateJWT,
  campsiteSafetyAlerts.updateCampsiteSafetyAlert
);
router.delete(
  '/:campsiteId/safety-alerts/:alertId',
  authenticateJWT,
  campsiteSafetyAlerts.deleteCampsiteSafetyAlert
);
router.post(
  '/:campsiteId/safety-alerts/:alertId/acknowledge',
  authenticateJWT,
  campsiteSafetyAlerts.acknowledgeCampsiteSafetyAlert
);

module.exports = router;
