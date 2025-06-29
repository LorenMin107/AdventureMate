const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware for various endpoints
 * This helps prevent abuse and brute force attacks
 */

// Default rate limit options
const defaultOptions = {
  standardWindowMs: 15 * 60 * 1000, // 15 minutes
  standardMax: 1000, // 1000 requests per windowMs (increased from 100)
  message: 'Too many requests from this IP, please try again later'
};

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: defaultOptions.standardWindowMs,
  max: defaultOptions.standardMax,
  message: {
    error: 'Rate limit exceeded',
    message: defaultOptions.message
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// More restrictive rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // 200 requests per hour (increased from 100, comment was incorrect)
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for email verification endpoints
const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour (increased from 50, comment was incorrect)
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many verification attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for resending verification emails
const resendVerificationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 60, // 60 requests per day (increased from 30, comment was incorrect)
  message: {
    error: 'Rate limit exceeded',
    message: 'You have reached the limit for resending verification emails. Please try again tomorrow.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  emailVerificationLimiter,
  resendVerificationLimiter
};
