/**
 * Middleware for handling API deprecation
 * This middleware adds deprecation notices to legacy endpoints
 */
const DeprecationLog = require('../models/deprecationLog');
const ConversionLog = require('../models/conversionLog');

/**
 * Add deprecation notice to response headers
 * @param {Object} options - Deprecation options
 * @param {string} options.message - Deprecation message
 * @param {string} options.version - Version when the endpoint will be removed
 * @param {string} options.alternativeUrl - URL of the alternative endpoint
 * @param {Date} options.sunsetDate - Date when the endpoint will be removed
 * @returns {Function} Middleware function
 */
const deprecateEndpoint = (options = {}) => {
  const defaultOptions = {
    message: 'This endpoint is deprecated and will be removed in a future version',
    version: 'v2',
    alternativeUrl: null,
    sunsetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 180 days from now
  };

  const opts = { ...defaultOptions, ...options };

  return (req, res, next) => {
    // Add deprecation headers
    res.set('Deprecation', 'true');

    // Add sunset header if provided
    if (opts.sunsetDate) {
      res.set('Sunset', opts.sunsetDate.toUTCString());
    }

    // Build Link header with alternative URL if provided
    if (opts.alternativeUrl) {
      res.set('Link', `<${opts.alternativeUrl}>; rel="successor-version"`);
    }

    // Add deprecation message to response
    const originalSend = res.send;
    res.send = function(body) {
      // If the response is JSON, add deprecation warning
      if (res.get('Content-Type')?.includes('application/json')) {
        try {
          let data = body;

          // If body is a string, parse it as JSON
          if (typeof body === 'string') {
            data = JSON.parse(body);
          }

          // Add deprecation warning to the response
          data = {
            ...data,
            deprecationWarning: {
              message: opts.message,
              version: opts.version,
              alternativeUrl: opts.alternativeUrl,
              sunsetDate: opts.sunsetDate?.toISOString()
            }
          };

          // Convert back to string if the original body was a string
          if (typeof body === 'string') {
            body = JSON.stringify(data);
          } else {
            body = data;
          }
        } catch (error) {
          console.error('Error adding deprecation warning to response:', error);
        }
      }

      // Call the original send method
      return originalSend.call(this, body);
    };

    // Log deprecation usage
    logDeprecationUsage(req, opts);

    next();
  };
};

/**
 * Log deprecation usage for tracking
 * @param {Object} req - Express request object
 * @param {Object} options - Deprecation options
 */
const logDeprecationUsage = (req, options) => {
  const logData = {
    timestamp: new Date(),
    endpoint: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id,
    deprecationVersion: options.version,
    alternativeUrl: options.alternativeUrl
  };

  // Log to console for debugging
  console.log('DEPRECATION USAGE:', JSON.stringify(logData));

  // Store in database
  DeprecationLog.create(logData)
    .catch(err => console.error('Error logging deprecation usage:', err));
};

/**
 * Add session to JWT conversion middleware
 * This middleware detects session-based authentication and adds a JWT token to the response
 * @returns {Function} Middleware function
 */
const convertSessionToJWT = () => {
  return async (req, res, next) => {
    // Skip conversion for login and register routes to prevent infinite loops
    if (req.originalUrl.includes('/login') || req.originalUrl.includes('/register')) {
      return next();
    }

    // Check if user is authenticated via session but not via JWT
    if (req.isAuthenticated && req.isAuthenticated() && !req.isJwtAuthenticated && req.user) {
      try {
        // Generate JWT tokens for the user
        const { generateAccessToken, generateRefreshToken } = require('../utils/jwtUtils');
        const accessToken = generateAccessToken(req.user);
        const refreshToken = await generateRefreshToken(req.user, req);

        // Add tokens to response headers
        res.set('X-Access-Token', accessToken);
        res.set('X-Refresh-Token', refreshToken.token);

        // Add conversion notice to response
        const originalSend = res.send;
        res.send = function(body) {
          // If the response is JSON, add conversion notice
          if (res.get('Content-Type')?.includes('application/json')) {
            try {
              let data = body;

              // If body is a string, parse it as JSON
              if (typeof body === 'string') {
                data = JSON.parse(body);
              }

              // Add conversion notice to the response
              data = {
                ...data,
                authConversion: {
                  message: 'Session-based authentication is deprecated. Please use the provided JWT tokens for future requests.',
                  accessToken,
                  refreshToken: refreshToken.token,
                  expiresAt: refreshToken.expiresAt
                }
              };

              // Convert back to string if the original body was a string
              if (typeof body === 'string') {
                body = JSON.stringify(data);
              } else {
                body = data;
              }
            } catch (error) {
              console.error('Error adding auth conversion notice to response:', error);
            }
          }

          // Call the original send method
          return originalSend.call(this, body);
        };

        // Log successful conversion for tracking
        logSessionConversion(req, true);
      } catch (error) {
        console.error('Error converting session to JWT:', error);
        // Log failed conversion for tracking
        logSessionConversion(req, false, error.message);
      }
    }

    next();
  };
};

/**
 * Log session to JWT conversion for tracking
 * @param {Object} req - Express request object
 * @param {boolean} successful - Whether the conversion was successful
 * @param {string} error - Error message if conversion failed
 */
const logSessionConversion = (req, successful = true, error = null) => {
  const logData = {
    timestamp: new Date(),
    endpoint: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id,
    successful,
    error
  };

  // Log to console for debugging
  console.log('SESSION CONVERSION:', JSON.stringify(logData));

  // Store in database
  if (logData.userId) {
    ConversionLog.create(logData)
      .catch(err => console.error('Error logging session conversion:', err));
  } else {
    console.warn('Cannot log session conversion: No user ID provided');
  }
};

module.exports = {
  deprecateEndpoint,
  convertSessionToJWT
};
