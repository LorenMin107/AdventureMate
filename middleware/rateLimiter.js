const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware for various endpoints
 * This helps prevent abuse and brute force attacks
 */

// Default rate limit options
const defaultOptions = {
  standardWindowMs: 15 * 60 * 1000, // 15 minutes
  standardMax: 3000, // 3000 requests per windowMs (increased from 2000)
  message: 'Too many requests from this IP, please try again later',
};

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: defaultOptions.standardWindowMs,
  max: defaultOptions.standardMax,
  message: {
    error: 'Rate limit exceeded',
    message: defaultOptions.message,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// More restrictive rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1500, // 1500 requests per hour (increased from 1000)
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for successful email verification
  skip: (req, res) => {
    // If the request has a verified email token cookie, skip rate limiting
    return req.cookies && req.cookies.email_verified === 'true';
  },
});

// Rate limiter for email verification endpoints
const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // 200 requests per hour (increased from 100)
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many verification attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for resending verification emails
const resendVerificationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 120, // 120 requests per day (increased from 60)
  message: {
    error: 'Rate limit exceeded',
    message:
      'You have reached the limit for resending verification emails. Please try again tomorrow.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for password reset endpoints
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many password reset attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter specifically for auth status checks
// This is more permissive since it's called frequently by the client
const authStatusLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5000, // 5000 requests per hour
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many authentication status checks, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for requests with a valid token
  skip: (req) => {
    // If the request has a valid JWT token, skip rate limiting
    const authHeader = req.headers.authorization;
    return authHeader && authHeader.startsWith('Bearer ');
  },
});

// Rate limiter specifically for Google OAuth endpoint
// More restrictive due to the sensitive nature of the endpoint
const googleOAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour (much more restrictive than general auth)
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many Google OAuth attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Additional security: Track by IP and user agent combination
  // Using the built-in keyGenerator to properly handle IPv6 addresses
  keyGenerator: (req) => {
    const userAgent = req.headers['user-agent'] || 'unknown';
    // Use the built-in ipKeyGenerator helper for proper IPv6 handling
    const ipKey = rateLimit.ipKeyGenerator(req);
    return `${ipKey}-${userAgent}`;
  },
  // Skip rate limiting for successful OAuth flows (to avoid blocking legitimate users)
  skip: (req, res) => {
    // If the response indicates success, skip rate limiting
    return res.statusCode === 200;
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  emailVerificationLimiter,
  resendVerificationLimiter,
  passwordResetLimiter,
  authStatusLimiter,
  googleOAuthLimiter,
};
