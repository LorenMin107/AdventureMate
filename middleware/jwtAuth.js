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
  { method: 'GET', pattern: /^\/api\/v1\/campgrounds\?.*$/ }, // Allow query parameters

  // Campsites
  { method: 'GET', pattern: /^\/api\/v1\/campgrounds\/[^\/]+\/campsites\/?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/campsites\/[^\/]+\/?$/ },

  // Reviews
  { method: 'GET', pattern: /^\/api\/v1\/campgrounds\/[^\/]+\/reviews\/?$/ },

  // Forum (read-only access for guests)
  { method: 'GET', pattern: /^\/api\/v1\/forum\/?(\?.*)?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/forum\/categories\/?(\?.*)?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/forum\/stats\/?(\?.*)?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/forum\/[^\/]+\/?(\?.*)?$/ },

  // Weather (public endpoint)
  { method: 'GET', pattern: /^\/api\/v1\/weather\/?(\?.*)?$/ },

  // Safety Alerts (public read access)
  { method: 'GET', pattern: /^\/api\/v1\/campgrounds\/[^\/]+\/safety-alerts\/?(\?.*)?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/campgrounds\/[^\/]+\/safety-alerts\/active\/?(\?.*)?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/campgrounds\/[^\/]+\/safety-alerts\/[^\/]+\/?$/ },

  // Mapbox (public endpoint)
  { method: 'GET', pattern: /^\/api\/v1\/mapbox\/geocode\/?(\?.*)?$/ },

  // Cloudinary (public endpoints for URL generation)
  { method: 'GET', pattern: /^\/api\/v1\/cloudinary\/url\/?(\?.*)?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/cloudinary\/thumbnail\/?(\?.*)?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/cloudinary\/responsive\/?(\?.*)?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/cloudinary\/metadata\/?(\?.*)?$/ },

  // Auth endpoints (public for registration/login)
  { method: 'POST', pattern: /^\/api\/v1\/auth\/register\/?$/ },
  { method: 'POST', pattern: /^\/api\/v1\/auth\/login\/?$/ },
  { method: 'POST', pattern: /^\/api\/v1\/auth\/refresh\/?$/ },
  { method: 'POST', pattern: /^\/api\/v1\/auth\/forgot-password\/?$/ },
  { method: 'POST', pattern: /^\/api\/v1\/auth\/reset-password\/?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/auth\/verify-email\/?(\?.*)?$/ },
  { method: 'POST', pattern: /^\/api\/v1\/auth\/resend-verification\/?$/ },
  { method: 'POST', pattern: /^\/api\/v1\/auth\/resend-verification-email-unauthenticated\/?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/auth\/status\/?$/ },
  // Google OAuth endpoint - requires additional security validation
  { method: 'POST', pattern: /^\/api\/v1\/auth\/google\/?$/, requiresSecurityValidation: true },
];

/**
 * Check if the request is for a public API endpoint
 * @param {Object} req - Express request object
 * @returns {Object} - Object with isPublic boolean and requiresSecurityValidation boolean
 */
const isPublicApiEndpoint = (req) => {
  const endpoint = publicApiEndpoints.find(
    (endpoint) => req.method === endpoint.method && endpoint.pattern.test(req.originalUrl)
  );

  return {
    isPublic: !!endpoint,
    requiresSecurityValidation: endpoint?.requiresSecurityValidation || false,
  };
};

/**
 * Validate Google OAuth request security
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Boolean} - True if validation passes
 */
const validateGoogleOAuthSecurity = (req, res) => {
  // Validate required fields
  const { code, redirectUri } = req.body;

  if (!code || !redirectUri) {
    logWarn('Google OAuth security validation failed: Missing required fields', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      hasCode: !!code,
      hasRedirectUri: !!redirectUri,
    });

    sendAuthError(res, 'Bad Request', 'Authorization code and redirect URI are required', 400);
    return false;
  }

  // Validate authorization code format (should be a string and not too long)
  if (typeof code !== 'string' || code.length > 1000) {
    logWarn('Google OAuth security validation failed: Invalid authorization code format', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      codeLength: code?.length,
    });

    sendAuthError(res, 'Bad Request', 'Invalid authorization code format', 400);
    return false;
  }

  // Validate redirect URI format
  try {
    const url = new URL(redirectUri);
    // Ensure it's a valid HTTPS URL or localhost for development
    if (url.protocol !== 'https:' && !url.hostname.includes('localhost')) {
      logWarn('Google OAuth security validation failed: Invalid redirect URI protocol', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        redirectUri: redirectUri,
      });

      sendAuthError(res, 'Bad Request', 'Invalid redirect URI', 400);
      return false;
    }
  } catch (error) {
    logWarn('Google OAuth security validation failed: Invalid redirect URI format', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      redirectUri: redirectUri,
      error: error.message,
    });

    sendAuthError(res, 'Bad Request', 'Invalid redirect URI format', 400);
    return false;
  }

  // Validate Content-Type header
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    logWarn('Google OAuth security validation failed: Invalid Content-Type', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      contentType: contentType,
    });

    sendAuthError(res, 'Bad Request', 'Content-Type must be application/json', 400);
    return false;
  }

  // Additional security: Check for suspicious patterns
  const suspiciousPatterns = [/<script/i, /javascript:/i, /data:/i, /vbscript:/i];

  const requestBody = JSON.stringify(req.body);
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestBody)) {
      logWarn('Google OAuth security validation failed: Suspicious content detected', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        pattern: pattern.source,
      });

      sendAuthError(res, 'Bad Request', 'Invalid request content', 400);
      return false;
    }
  }

  return true;
};

/**
 * Check if the request requires authentication
 * @param {Object} req - Express request object
 * @returns {Boolean} - True if the request requires authentication
 */
const requiresAuthentication = (req) => {
  // All API v1 endpoints require authentication unless they're in the public list
  return req.originalUrl.includes('/api/v1/') && !isPublicApiEndpoint(req).isPublic;
};

/**
 * Send authentication error response
 * @param {Object} res - Express response object
 * @param {string} error - Error type
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 */
const sendAuthError = (res, error, message, statusCode = 401) => {
  if (res.headersSent) {
    return;
  }

  return ApiResponse.error(error, message, statusCode).send(res);
};

/**
 * Middleware to authenticate requests using JWT
 * This middleware checks for a valid JWT in the Authorization header
 * and sets req.user if the token is valid
 */
const authenticateJWT = async (req, res, next) => {
  try {
    // Check if this is a public endpoint that requires additional security validation
    const publicEndpointInfo = isPublicApiEndpoint(req);

    if (publicEndpointInfo.isPublic && publicEndpointInfo.requiresSecurityValidation) {
      // Apply additional security validation for sensitive public endpoints
      if (!validateGoogleOAuthSecurity(req, res)) {
        return; // Validation failed, response already sent
      }
    }

    // Extract token from Authorization header
    const token = extractTokenFromHeader(req);

    if (!token) {
      // No token provided
      if (requiresAuthentication(req)) {
        logDebug('JWT authentication failed: No token provided', {
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
        });

        return sendAuthError(res, 'Authentication required', 'No authentication token provided');
      }
      // For public endpoints, continue without authentication
      return next();
    }

    // Verify the token
    try {
      const decoded = await verifyAccessToken(token);

      // Find the user
      const user = await User.findById(decoded.sub);

      if (!user) {
        logWarn('JWT authentication failed: User not found', {
          tokenSubject: decoded.sub,
          method: req.method,
          url: req.originalUrl,
        });

        if (requiresAuthentication(req)) {
          return sendAuthError(res, 'Authentication failed', 'User not found');
        }
        // For public endpoints, continue without authentication
        return next();
      }

      // Check if user is suspended
      if (user.isSuspended) {
        logWarn('JWT authentication failed: User is suspended', {
          userId: user._id,
          method: req.method,
          url: req.originalUrl,
          suspensionReason: user.suspensionReason,
          suspendedAt: user.suspendedAt,
        });

        if (requiresAuthentication(req)) {
          return sendAuthError(
            res,
            'Account suspended',
            'Your account has been suspended. Please contact support for more information.',
            403
          );
        }
        // For public endpoints, continue without authentication
        return next();
      }

      // If user is an owner, also check owner suspension status
      if (user.isOwner) {
        const Owner = require('../models/owner');
        const owner = await Owner.findOne({ user: user._id });

        if (owner && !owner.isActive) {
          logWarn('JWT authentication failed: Owner account is suspended', {
            userId: user._id,
            ownerId: owner._id,
            method: req.method,
            url: req.originalUrl,
            suspensionReason: owner.suspensionReason,
            suspendedAt: owner.suspendedAt,
          });

          if (requiresAuthentication(req)) {
            return sendAuthError(
              res,
              'Owner account suspended',
              'Your owner account has been suspended. Please contact support for more information.',
              403
            );
          }
          // For public endpoints, continue without authentication
          return next();
        }
      }

      // Check if suspension has expired
      if (user.suspensionExpiresAt && new Date() > user.suspensionExpiresAt) {
        // Auto-reactivate the user
        user.isSuspended = false;
        user.suspendedAt = null;
        user.suspendedBy = null;
        user.suspensionReason = null;
        user.suspensionExpiresAt = null;
        await user.save();

        // If user is an owner, also reactivate their owner account
        if (user.isOwner) {
          const Owner = require('../models/owner');
          const owner = await Owner.findOne({ user: user._id });

          if (owner) {
            owner.isActive = true;
            owner.suspendedAt = null;
            owner.suspendedBy = null;
            owner.suspensionReason = null;
            owner.verificationStatus = 'verified';
            await owner.save();

            logInfo('Owner account also auto-reactivated', {
              userId: user._id,
              ownerId: owner._id,
            });
          }
        }

        logInfo('User suspension auto-expired', {
          userId: user._id,
          originalSuspensionExpiresAt: user.suspensionExpiresAt,
        });
      }

      // Set the user in the request object
      req.user = user;
      req.isAuthenticated = () => true; // For compatibility with passport
      req.isJwtAuthenticated = true; // Flag to indicate JWT authentication
      req.tokenData = decoded; // Store decoded token data for potential use
      req.accessToken = token; // Store the token for potential blacklisting on logout

      next();
    } catch (tokenError) {
      // Log the authentication failure
      logWarn('JWT authentication failed', {
        errorName: tokenError.name,
        errorMessage: tokenError.message,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      });

      if (requiresAuthentication(req)) {
        // Provide specific error messages based on the type of error
        if (tokenError.name === 'TokenExpiredError') {
          return sendAuthError(
            res,
            'Token expired',
            'Your authentication token has expired. Please refresh the token or log in again.'
          );
        } else if (tokenError.name === 'RevokedTokenError') {
          return sendAuthError(
            res,
            'Token revoked',
            'Your authentication token has been revoked. Please log in again.'
          );
        } else if (tokenError.name === 'JsonWebTokenError') {
          return sendAuthError(
            res,
            'Invalid token',
            'The provided authentication token is invalid.'
          );
        } else {
          return sendAuthError(res, 'Authentication failed', 'Token verification failed');
        }
      }
      // For public endpoints, continue without authentication
      next();
    }
  } catch (error) {
    logError('Error in JWT authentication middleware', error, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    if (requiresAuthentication(req)) {
      return sendAuthError(res, 'Authentication error', 'An error occurred during authentication');
    }
    // For public endpoints, continue without authentication
    next();
  }
};

/**
 * Middleware to require authentication
 * This middleware should be used after authenticateJWT
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return sendAuthError(res, 'Unauthorized', 'Authentication required');
  }
  next();
};

/**
 * Middleware to check if user is an admin
 * This middleware should be used after authenticateJWT and requireAuth
 */
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return ApiResponse.error('Forbidden', 'Admin privileges required', 403).send(res);
  }
  next();
};

/**
 * Middleware to check if user is an owner
 * This middleware should be used after authenticateJWT and requireAuth
 */
const requireOwner = (req, res, next) => {
  if (!req.user.isOwner) {
    return ApiResponse.error('Forbidden', 'Owner privileges required', 403).send(res);
  }
  next();
};

/**
 * Middleware to check if user's email is verified
 * This middleware should be used after authenticateJWT and requireAuth
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return ApiResponse.error(
      'Forbidden',
      'Email verification required. Please verify your email address before accessing this resource.',
      403
    ).send(res);
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
