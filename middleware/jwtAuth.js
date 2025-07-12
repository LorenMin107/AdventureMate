const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwtUtils');
const User = require('../models/user');
const ExpressError = require('../utils/ExpressError');
const ApiResponse = require('../utils/ApiResponse');
const { logError, logWarn, logDebug } = require('../utils/logger');

/**
 * List of public API endpoints that don't require authentication
 * This is used to prevent logging "JWT authentication failed" messages for these endpoints
 */
const publicApiEndpoints = [
  // Campgrounds
  { method: 'GET', pattern: /^\/api\/v1\/campgrounds\/?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/campgrounds\/search\/?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/campgrounds\/[^\/]+\/?$/ },

  // Campsites
  { method: 'GET', pattern: /^\/api\/v1\/campgrounds\/[^\/]+\/campsites\/?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/campsites\/[^\/]+\/?$/ },

  // Reviews
  { method: 'GET', pattern: /^\/api\/v1\/campgrounds\/[^\/]+\/reviews\/?$/ },
];

/**
 * Check if the request is for a public API endpoint
 * @param {Object} req - Express request object
 * @returns {Boolean} - True if the request is for a public API endpoint
 */
const isPublicApiEndpoint = (req) => {
  return publicApiEndpoints.some(
    (endpoint) => req.method === endpoint.method && endpoint.pattern.test(req.originalUrl)
  );
};

/**
 * Middleware to authenticate requests using JWT
 * This middleware checks for a valid JWT in the Authorization header
 * and sets req.user if the token is valid
 */
const authenticateJWT = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req);

    if (!token) {
      // No token provided
      // Check if this is an API endpoint that requires authentication
      if (
        req.originalUrl.includes('/api/v1/') &&
        !req.originalUrl.includes('/auth/') &&
        !req.originalUrl.includes('/public/') &&
        !isPublicApiEndpoint(req)
      ) {
        // Log the missing token for debugging
        logDebug('JWT authentication failed: No token provided', {
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
        });

        // For API endpoints that require authentication, return 401
        if (
          req.headers['x-requested-with'] === 'XMLHttpRequest' ||
          req.headers.accept?.includes('application/json')
        ) {
          return ApiResponse.error(
            'Authentication required',
            'No authentication token provided',
            401
          ).send(res);
        }
      }
      return next();
    }

    // Verify the token
    try {
      // Use await with verifyAccessToken since it's now an async function
      const decoded = await verifyAccessToken(token);

      // Find the user
      const user = await User.findById(decoded.sub);

      if (!user) {
        logWarn('JWT authentication failed: User not found', {
          tokenSubject: decoded.sub,
          method: req.method,
          url: req.originalUrl,
        });

        // For API endpoints that require authentication, return 401
        if (
          req.originalUrl.includes('/api/v1/') &&
          !req.originalUrl.includes('/auth/') &&
          !req.originalUrl.includes('/public/') &&
          !isPublicApiEndpoint(req) &&
          (req.headers['x-requested-with'] === 'XMLHttpRequest' ||
            req.headers.accept?.includes('application/json'))
        ) {
          return ApiResponse.error('Authentication failed', 'User not found', 401).send(res);
        }

        return next(); // User not found, continue without authentication
      }

      // Set the user in the request object
      req.user = user;
      req.isAuthenticated = () => true; // For compatibility with passport
      req.isJwtAuthenticated = true; // Flag to indicate JWT authentication
      req.tokenData = decoded; // Store decoded token data for potential use
      req.accessToken = token; // Store the token for potential blacklisting on logout

      next();
    } catch (tokenError) {
      // Provide detailed error information based on the type of error
      if (tokenError.name === 'TokenExpiredError') {
        logWarn('JWT authentication failed: Token expired', {
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
        });
        // For API endpoints that explicitly require authentication, return 401
        if (
          req.originalUrl.includes('/api/v1/') &&
          req.headers['x-requested-with'] === 'XMLHttpRequest'
        ) {
          return ApiResponse.error(
            'Token expired',
            'Your authentication token has expired. Please refresh the token or log in again.',
            401
          ).send(res);
        }
      } else if (tokenError.name === 'RevokedTokenError') {
        logWarn('JWT authentication failed: Token revoked', {
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
        });
        // For API endpoints that explicitly require authentication, return 401
        if (
          req.originalUrl.includes('/api/v1/') &&
          req.headers['x-requested-with'] === 'XMLHttpRequest'
        ) {
          return ApiResponse.error(
            'Token revoked',
            'Your authentication token has been revoked. Please log in again.',
            401
          ).send(res);
        }
      } else if (tokenError.name === 'JsonWebTokenError') {
        logWarn('JWT authentication failed: Invalid token', {
          method: req.method,
          url: req.originalUrl,
          error: tokenError.message,
          ip: req.ip,
        });
      } else {
        logWarn('JWT authentication failed', {
          errorName: tokenError.name,
          errorMessage: tokenError.message,
          method: req.method,
          url: req.originalUrl,
        });
      }

      // For regular requests, continue without authentication
      next();
    }
  } catch (error) {
    logError('Error in JWT authentication middleware', error, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
    next();
  }
};

/**
 * Middleware to require authentication
 * This middleware should be used after authenticateJWT
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }
  next();
};

/**
 * Middleware to check if user is an admin
 * This middleware should be used after authenticateJWT and requireAuth
 */
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin privileges required',
    });
  }
  next();
};

/**
 * Middleware to check if user is an owner
 * This middleware should be used after authenticateJWT and requireAuth
 */
const requireOwner = (req, res, next) => {
  if (!req.user.isOwner) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Owner privileges required',
    });
  }
  next();
};

/**
 * Middleware to check if user's email is verified
 * This middleware should be used after authenticateJWT and requireAuth
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      error: 'Forbidden',
      message:
        'Email verification required. Please verify your email address before accessing this resource.',
    });
  }
  next();
};

module.exports = {
  authenticateJWT,
  requireAuth,
  requireAdmin,
  requireOwner,
  requireEmailVerified,
};
