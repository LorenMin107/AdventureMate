
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const performanceConfig = require('../config/performance');

// Compression middleware
const compressionMiddleware = compression({
  threshold: performanceConfig.compression.threshold,
  level: performanceConfig.compression.level
});

// Rate limiting middleware
const rateLimitMiddleware = rateLimit({
  windowMs: performanceConfig.rateLimiting.windowMs,
  max: performanceConfig.rateLimiting.max,
  message: {
    status: 'error',
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  compressionMiddleware,
  rateLimitMiddleware
};
