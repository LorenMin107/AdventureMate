const { body, param, query, validationResult } = require('express-validator');
const ApiResponse = require('../utils/ApiResponse');
const ExpressError = require('../utils/ExpressError');

/**
 * Middleware to validate request data
 * @param {Array|Function} validations - Array of express-validator validation chains or a middleware function
 * @returns {Function} - Express middleware function
 */
const validate = (validations) => {
  // If validations is a function (middleware), just return it
  if (typeof validations === 'function') {
    return validations;
  }

  // If validations is not an array, convert it to an array with a single item
  if (!Array.isArray(validations)) {
    validations = [validations];
  }

  return async (req, res, next) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check if there are validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format validation errors
    const extractedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));

    // Return standardized error response
    return ApiResponse.error(
      'Validation Error',
      'The request data failed validation',
      400,
      { errors: extractedErrors }
    ).send(res);
  };
};

/**
 * Validation schemas for campgrounds
 */
const campgroundValidators = {
  create: [
    body('campground.title')
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    body('campground.location')
      .notEmpty().withMessage('Location is required'),
    body('campground.description')
      .notEmpty().withMessage('Description is required')
      .isLength({ min: 10 }).withMessage('Description must be at least 10 characters')
  ],

  update: [
    param('id').isMongoId().withMessage('Invalid campground ID format'),
    body('campground.title')
      .optional()
      .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters')
  ],

  delete: [
    param('id').isMongoId().withMessage('Invalid campground ID format')
  ],

  show: [
    param('id').isMongoId().withMessage('Invalid campground ID format')
  ],

  search: [
    query('search').notEmpty().withMessage('Search term is required')
  ]
};

/**
 * Validation schemas for reviews
 */
const reviewValidators = {
  create: [
    param('id').isMongoId().withMessage('Invalid campground ID format'),
    body('review.rating')
      .notEmpty().withMessage('Rating is required')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('review.body')
      .notEmpty().withMessage('Review text is required')
      .isLength({ min: 5 }).withMessage('Review must be at least 5 characters')
  ],

  delete: [
    param('id').isMongoId().withMessage('Invalid campground ID format'),
    param('reviewId').isMongoId().withMessage('Invalid review ID format')
  ]
};

/**
 * Validation schemas for user operations
 */
const userValidators = {
  register: [
    body('username')
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/\d/).withMessage('Password must contain at least one number')
      .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter')
  ],

  login: [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ]
};

/**
 * Validation schemas for booking operations
 */
const bookingValidators = {
  create: [
    body('booking.campgroundId').isMongoId().withMessage('Invalid campground ID format'),
    body('booking.startDate')
      .notEmpty().withMessage('Start date is required')
      .isISO8601().withMessage('Start date must be a valid date'),
    body('booking.endDate')
      .notEmpty().withMessage('End date is required')
      .isISO8601().withMessage('End date must be a valid date')
      .custom((value, { req }) => {
        const startDate = new Date(req.body.booking.startDate);
        const endDate = new Date(value);
        return endDate > startDate;
      }).withMessage('End date must be after start date')
  ],

  update: [
    param('id').isMongoId().withMessage('Invalid booking ID format'),
    body('booking.startDate')
      .optional()
      .isISO8601().withMessage('Start date must be a valid date'),
    body('booking.endDate')
      .optional()
      .isISO8601().withMessage('End date must be a valid date')
      .custom((value, { req }) => {
        if (!req.body.booking.startDate) return true;
        const startDate = new Date(req.body.booking.startDate);
        const endDate = new Date(value);
        return endDate > startDate;
      }).withMessage('End date must be after start date')
  ],

  delete: [
    param('id').isMongoId().withMessage('Invalid booking ID format')
  ],

  show: [
    param('id').isMongoId().withMessage('Invalid booking ID format')
  ]
};

module.exports = {
  validate,
  campgroundValidators,
  reviewValidators,
  userValidators,
  bookingValidators
};
