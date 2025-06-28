/**
 * Error handling utilities for standardized error handling across the application
 */

const logger = require('./logger');
const ApiResponse = require('./ApiResponse');
const ExpressError = require('./ExpressError');

// Create a logger instance for error handling
const errorLogger = logger.child('error-handler');

/**
 * Middleware for handling errors
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Extract status code and set default if not provided
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  
  // Log the error with appropriate context
  const logContext = {
    error: err,
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user ? req.user._id : 'unauthenticated'
    }
  };
  
  // Log error with different levels based on status code
  if (statusCode >= 500) {
    errorLogger.error(`Server Error: ${message}`, logContext);
  } else if (statusCode >= 400) {
    errorLogger.warn(`Client Error: ${message}`, logContext);
  } else {
    errorLogger.info(`Other Error: ${message}`, logContext);
  }

  // Check if the request is an API request
  if (req.originalUrl.startsWith('/api')) {
    // Return standardized JSON error response for API requests
    return ApiResponse.error(
      message,
      err.detail || 'An error occurred while processing your request',
      statusCode
    ).send(res);
  }

  // Render error template for traditional requests
  res.status(statusCode).render('error', { err });
};

/**
 * Wrap an async function to catch errors and pass them to the error handler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create a validation error
 * @param {string} message - Error message
 * @param {Object} errors - Validation errors
 * @returns {ExpressError} - Validation error
 */
const validationError = (message = 'Validation Error', errors = {}) => {
  const error = ExpressError.validation(message);
  error.detail = 'The provided data failed validation';
  error.errors = errors;
  return error;
};

/**
 * Create a not found error
 * @param {string} resource - Resource type
 * @param {string} id - Resource ID
 * @returns {ExpressError} - Not found error
 */
const notFoundError = (resource = 'Resource', id = '') => {
  const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
  const error = ExpressError.notFound(message);
  error.detail = `The requested ${resource.toLowerCase()} could not be found`;
  return error;
};

/**
 * Create an unauthorized error
 * @param {string} message - Error message
 * @returns {ExpressError} - Unauthorized error
 */
const unauthorizedError = (message = 'Unauthorized') => {
  const error = ExpressError.unauthorized(message);
  error.detail = 'You are not authorized to perform this action';
  return error;
};

/**
 * Create a forbidden error
 * @param {string} message - Error message
 * @returns {ExpressError} - Forbidden error
 */
const forbiddenError = (message = 'Forbidden') => {
  const error = ExpressError.forbidden(message);
  error.detail = 'You do not have permission to access this resource';
  return error;
};

/**
 * Create a server error
 * @param {string} message - Error message
 * @returns {ExpressError} - Server error
 */
const serverError = (message = 'Internal Server Error') => {
  const error = ExpressError.internal(message);
  error.detail = 'An unexpected error occurred on the server';
  return error;
};

module.exports = {
  errorHandler,
  asyncHandler,
  validationError,
  notFoundError,
  unauthorizedError,
  forbiddenError,
  serverError
};