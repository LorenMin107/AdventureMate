const ApiResponse = require('../utils/ApiResponse');
const AuditLog = require('../models/auditLog');
const { logError, logInfo, logDebug } = require('../utils/logger');

/**
 * Permission middleware for role-based access control
 * This middleware provides more granular control over user permissions
 */

/**
 * Check if user has any of the specified roles
 * @param {Array} roles - Array of roles to check
 * @returns {Function} Middleware function
 */
const hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error('Unauthorized', 'Authentication required', 401).send(res);
    }

    // Check if user has any of the specified roles
    const userRoles = getUserRoles(req.user);
    const hasRequiredRole = roles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      return ApiResponse.error(
        'Forbidden',
        'You do not have permission to access this resource',
        403
      ).send(res);
    }

    next();
  };
};

/**
 * Check if user has all of the specified roles
 * @param {Array} roles - Array of roles to check
 * @returns {Function} Middleware function
 */
const hasAllRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error('Unauthorized', 'Authentication required', 401).send(res);
    }

    // Check if user has all of the specified roles
    const userRoles = getUserRoles(req.user);
    const hasAllRequiredRoles = roles.every((role) => userRoles.includes(role));

    if (!hasAllRequiredRoles) {
      return ApiResponse.error(
        'Forbidden',
        'You do not have permission to access this resource',
        403
      ).send(res);
    }

    next();
  };
};

/**
 * Check if user has permission to access a resource
 * @param {string} permission - Permission to check
 * @returns {Function} Middleware function
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error('Unauthorized', 'Authentication required', 401).send(res);
    }

    // Check if user has the specified permission
    const userPermissions = getUserPermissions(req.user);
    if (!userPermissions.includes(permission)) {
      return ApiResponse.error(
        'Forbidden',
        'You do not have permission to access this resource',
        403
      ).send(res);
    }

    next();
  };
};

/**
 * Check if user is the owner of a resource or has admin role
 * @param {Function} getResourceOwnerId - Function to get the owner ID of the resource
 * @returns {Function} Middleware function
 */
const isResourceOwnerOrAdmin = (getResourceOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error('Unauthorized', 'Authentication required', 401).send(res);
    }

    // If user is admin, allow access
    if (req.user.isAdmin) {
      return next();
    }

    try {
      // Get the owner ID of the resource
      const ownerId = await getResourceOwnerId(req);

      // Check if user is the owner
      if (ownerId && ownerId.equals(req.user._id)) {
        return next();
      }

      // User is not the owner or admin
      return ApiResponse.error(
        'Forbidden',
        'You do not have permission to access this resource',
        403
      ).send(res);
    } catch (error) {
      logError('Error checking resource ownership', error, {
        endpoint: req.originalUrl,
        userId: req.user?._id,
        method: req.method,
      });
      return ApiResponse.error(
        'Server Error',
        'An error occurred while checking permissions',
        500
      ).send(res);
    }
  };
};

/**
 * Create audit log entry for sensitive operations
 * @param {string} action - Action being performed
 * @param {string} resource - Resource being accessed
 * @param {Object} options - Additional options
 * @returns {Function} Middleware function
 */
const auditLog = (action, resource, options = {}) => {
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    // Create audit log entry
    const auditEntry = {
      user: req.user._id,
      action,
      resource,
      resourceId: options.resourceId || req.params.id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date(),
      details: options.details || {},
    };

    // Add request-specific details
    if (options.includeBody && req.body) {
      // Filter out sensitive fields
      const filteredBody = { ...req.body };
      ['password', 'token', 'accessToken', 'refreshToken'].forEach((field) => {
        if (filteredBody[field]) {
          filteredBody[field] = '[REDACTED]';
        }
      });
      auditEntry.details.body = filteredBody;
    }

    if (options.includeQuery && req.query) {
      auditEntry.details.query = req.query;
    }

    // Store audit log entry
    storeAuditLog(auditEntry).catch((error) =>
      logError('Error storing audit log', error, {
        auditEntry: auditEntry.action + ':' + auditEntry.resource,
        userId: auditEntry.user,
      })
    );

    // Continue with the request
    next();
  };
};

/**
 * Get user roles from user object
 * @param {Object} user - User object
 * @returns {Array} Array of user roles
 */
const getUserRoles = (user) => {
  const roles = ['user'];

  if (user.isAdmin) {
    roles.push('admin');
  }

  if (user.isOwner) {
    roles.push('owner');
  }

  return roles;
};

/**
 * Get user permissions from user object
 * @param {Object} user - User object
 * @returns {Array} Array of user permissions
 */
const getUserPermissions = (user) => {
  const permissions = ['read:own_profile', 'update:own_profile'];

  // Basic user permissions
  if (user.isEmailVerified) {
    permissions.push('create:review', 'update:own_review', 'delete:own_review');
    permissions.push(
      'create:booking',
      'read:own_booking',
      'update:own_booking',
      'cancel:own_booking'
    );
  }

  // Owner permissions
  if (user.isOwner) {
    permissions.push('create:campground', 'update:own_campground', 'delete:own_campground');
    permissions.push('create:campsite', 'update:own_campsite', 'delete:own_campsite');
    permissions.push('read:own_campground_bookings', 'update:own_campground_booking');
  }

  // Admin permissions
  if (user.isAdmin) {
    permissions.push('read:all_users', 'update:any_user', 'delete:any_user');
    permissions.push('read:all_campgrounds', 'update:any_campground', 'delete:any_campground');
    permissions.push('read:all_campsites', 'update:any_campsite', 'delete:any_campsite');
    permissions.push('read:all_bookings', 'update:any_booking', 'cancel:any_booking');
    permissions.push('read:all_reviews', 'update:any_review', 'delete:any_review');
    permissions.push('manage:owner_applications');
  }

  return permissions;
};

/**
 * Store audit log entry in database
 * @param {Object} auditEntry - Audit log entry
 * @returns {Promise} Promise that resolves when the entry is stored
 */
const storeAuditLog = async (auditEntry) => {
  try {
    // Log to console for debugging
    logInfo('Audit log entry created', {
      action: auditEntry.action,
      resource: auditEntry.resource,
      userId: auditEntry.user,
      ipAddress: auditEntry.ipAddress,
    });

    // Store in database
    await AuditLog.createLog(auditEntry);
  } catch (error) {
    logError('Error storing audit log', error, {
      action: auditEntry.action,
      resource: auditEntry.resource,
      userId: auditEntry.user,
    });
  }
};

module.exports = {
  hasRole,
  hasAllRoles,
  hasPermission,
  isResourceOwnerOrAdmin,
  auditLog,
  getUserRoles,
  getUserPermissions,
};
