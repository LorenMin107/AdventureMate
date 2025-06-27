class ExpressError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.isOperational = isOperational; // Indicates if this is an operational error that we can anticipate

    // Capture stack trace, excluding the constructor call from the stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   * @param {string} message - Error message
   * @returns {ExpressError} - ExpressError instance
   */
  static badRequest(message = 'Bad Request') {
    return new ExpressError(message, 400);
  }

  /**
   * Create a 401 Unauthorized error
   * @param {string} message - Error message
   * @returns {ExpressError} - ExpressError instance
   */
  static unauthorized(message = 'Unauthorized') {
    return new ExpressError(message, 401);
  }

  /**
   * Create a 403 Forbidden error
   * @param {string} message - Error message
   * @returns {ExpressError} - ExpressError instance
   */
  static forbidden(message = 'Forbidden') {
    return new ExpressError(message, 403);
  }

  /**
   * Create a 404 Not Found error
   * @param {string} message - Error message
   * @returns {ExpressError} - ExpressError instance
   */
  static notFound(message = 'Resource Not Found') {
    return new ExpressError(message, 404);
  }

  /**
   * Create a 500 Internal Server Error
   * @param {string} message - Error message
   * @returns {ExpressError} - ExpressError instance
   */
  static internal(message = 'Internal Server Error') {
    return new ExpressError(message, 500);
  }

  /**
   * Create a validation error (400 Bad Request)
   * @param {string} message - Error message
   * @returns {ExpressError} - ExpressError instance
   */
  static validation(message = 'Validation Error') {
    return new ExpressError(message, 400);
  }
}

module.exports = ExpressError;
