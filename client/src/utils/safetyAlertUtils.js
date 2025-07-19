/**
 * Utility functions for safety alert acknowledgment checks
 */

/**
 * Check if a user has acknowledged all required safety alerts for a campground
 * @param {Array} alerts - Array of safety alerts for the campground
 * @param {Object} currentUser - Current user object
 * @returns {Object} - { hasAcknowledgedAll: boolean, unacknowledgedAlerts: Array }
 */
export const checkSafetyAlertAcknowledgments = (alerts, currentUser) => {
  if (!alerts || !Array.isArray(alerts) || !currentUser) {
    return { hasAcknowledgedAll: true, unacknowledgedAlerts: [] };
  }

  const unacknowledgedAlerts = alerts.filter((alert) => {
    // Only check alerts that require acknowledgment
    if (!alert.requiresAcknowledgement) {
      return false;
    }

    // Check if user has acknowledged this alert
    const hasAcknowledged = (alert.acknowledgedBy || []).some((ack) => {
      if (!ack || !ack.user) return false;

      // Handle both populated user object and user ID string
      const ackUserId = typeof ack.user === 'object' ? ack.user._id : ack.user;
      const currentUserId = currentUser._id;

      return ackUserId.toString() === currentUserId.toString();
    });

    // Debug logging removed for production performance

    return !hasAcknowledged;
  });

  return {
    hasAcknowledgedAll: unacknowledgedAlerts.length === 0,
    unacknowledgedAlerts,
  };
};

/**
 * Get a user-friendly message about unacknowledged safety alerts
 * @param {Array} unacknowledgedAlerts - Array of unacknowledged alerts
 * @returns {string} - User-friendly message
 */
export const getUnacknowledgedAlertsMessage = (unacknowledgedAlerts) => {
  if (!unacknowledgedAlerts || unacknowledgedAlerts.length === 0) {
    return '';
  }

  if (unacknowledgedAlerts.length === 1) {
    return `You must acknowledge the safety alert "${unacknowledgedAlerts[0].title}" before booking.`;
  }

  return `You must acknowledge ${unacknowledgedAlerts.length} safety alerts before booking.`;
};

/**
 * Check if a campground has any active safety alerts that require acknowledgment
 * @param {Array} alerts - Array of safety alerts for the campground
 * @returns {boolean} - True if there are alerts requiring acknowledgment
 */
export const hasRequiredAcknowledgments = (alerts) => {
  if (!alerts || !Array.isArray(alerts)) {
    return false;
  }

  return alerts.some((alert) => alert.requiresAcknowledgement === true);
};

/**
 * Check if a user has acknowledged all required safety alerts for both campground and campsite
 * @param {Array} campgroundAlerts - Array of safety alerts for the campground
 * @param {Array} campsiteAlerts - Array of safety alerts for the campsite
 * @param {Object} currentUser - Current user object
 * @returns {Object} - { hasAcknowledgedAll: boolean, unacknowledgedAlerts: Array }
 */
export const checkAllSafetyAlertAcknowledgments = (
  campgroundAlerts,
  campsiteAlerts,
  currentUser
) => {
  const campgroundCheck = checkSafetyAlertAcknowledgments(campgroundAlerts, currentUser);
  const campsiteCheck = checkSafetyAlertAcknowledgments(campsiteAlerts, currentUser);

  const allUnacknowledged = [
    ...campgroundCheck.unacknowledgedAlerts,
    ...campsiteCheck.unacknowledgedAlerts,
  ];

  return {
    hasAcknowledgedAll: allUnacknowledged.length === 0,
    unacknowledgedAlerts: allUnacknowledged,
  };
};
