const { body, param, query, validationResult } = require('express-validator');
const ApiResponse = require('../utils/ApiResponse');
const ExpressError = require('../utils/ExpressError');
const { logWarn } = require('../utils/logger');

/**
 * Sanitize sensitive data from request body for logging
 * @param {Object} body - Request body object
 * @returns {Object} - Sanitized body object
 */
const sanitizeBodyForLogging = (body) => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = [
    'password',
    'confirmPassword',
    'currentPassword',
    'newPassword',
    'token',
    'refreshToken',
    'accessToken',
    'apiKey',
    'secret',
    'creditCard',
    'cardNumber',
    'cvv',
    'ssn',
    'socialSecurityNumber',
  ];

  // Recursively sanitize nested objects
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        } else if (
          sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))
        ) {
          obj[key] = '[REDACTED]';
        }
      }
    }
  };

  sanitizeObject(sanitized);
  return sanitized;
};

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
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check if there are validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Log validation errors for debugging (with sanitized body)
    logWarn('Validation errors', {
      errors: errors.array(),
      body: sanitizeBodyForLogging(req.body),
    });

    // Format validation errors
    const extractedErrors = errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
    }));

    // Return validation error response with details
    return res.status(400).json({
      status: 'error',
      message: 'The request data failed validation',
      error: 'Validation Error',
      data: {
        errors: extractedErrors,
      },
    });
  };
};

/**
 * Validation schemas for campgrounds
 */
const campgroundValidators = {
  create: [
    body('campground.title')
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('campground.location').notEmpty().withMessage('Location is required'),
    body('campground.description')
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters'),
  ],

  update: [
    param('id').isMongoId().withMessage('Invalid campground ID format'),
    body('campground.title')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
  ],

  delete: [param('id').isMongoId().withMessage('Invalid campground ID format')],

  show: [param('id').isMongoId().withMessage('Invalid campground ID format')],

  search: [query('search').notEmpty().withMessage('Search term is required')],
  suggestions: [query('q').optional().isString().withMessage('Query must be a string')],
};

/**
 * Validation schemas for reviews
 */
const reviewValidators = {
  create: [
    param('id').isMongoId().withMessage('Invalid campground ID format'),
    body('review.rating')
      .notEmpty()
      .withMessage('Rating is required')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('review.body')
      .notEmpty()
      .withMessage('Review text is required')
      .isLength({ min: 5 })
      .withMessage('Review must be at least 5 characters'),
  ],

  delete: [
    param('id').isMongoId().withMessage('Invalid campground ID format'),
    param('reviewId').isMongoId().withMessage('Invalid review ID format'),
  ],
};

/**
 * Validation schemas for user operations
 */
const userValidators = {
  register: [
    body('username')
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Must be a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[a-zA-Z]/)
      .withMessage('Password must contain at least one letter'),
  ],

  login: [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Must be a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
  ],

  updateProfile: [
    body('username')
      .optional()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('profileName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Display name must be between 2 and 50 characters'),
    body('phone')
      .optional()
      .matches(/^\+?[0-9]{10,15}$/)
      .withMessage('Phone number must be between 10 and 15 digits'),
  ],
};

/**
 * Validation schemas for booking operations
 */
const bookingValidators = {
  create: [
    body('booking.campgroundId').isMongoId().withMessage('Invalid campground ID format'),
    body('booking.startDate')
      .notEmpty()
      .withMessage('Start date is required')
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    body('booking.endDate')
      .notEmpty()
      .withMessage('End date is required')
      .isISO8601()
      .withMessage('End date must be a valid date')
      .custom((value, { req }) => {
        const startDate = new Date(req.body.booking.startDate);
        const endDate = new Date(value);
        return endDate > startDate;
      })
      .withMessage('End date must be after start date'),
  ],

  update: [
    param('id').isMongoId().withMessage('Invalid booking ID format'),
    body('booking.startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    body('booking.endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date')
      .custom((value, { req }) => {
        if (!req.body.booking.startDate) return true;
        const startDate = new Date(req.body.booking.startDate);
        const endDate = new Date(value);
        return endDate > startDate;
      })
      .withMessage('End date must be after start date'),
  ],

  delete: [param('id').isMongoId().withMessage('Invalid booking ID format')],

  show: [param('id').isMongoId().withMessage('Invalid booking ID format')],
};

/**
 * Validation schemas for forum operations
 */
const forumValidators = {
  create: [
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    body('content')
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ min: 10, max: 5000 })
      .withMessage('Content must be between 10 and 5000 characters'),
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isIn([
        'general',
        'camping-tips',
        'equipment',
        'destinations',
        'safety',
        'reviews',
        'questions',
        'announcements',
      ])
      .withMessage('Invalid category'),
    body('type')
      .notEmpty()
      .withMessage('Type is required')
      .isIn(['discussion', 'question'])
      .withMessage('Type must be either discussion or question'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
      .custom((tags) => {
        if (tags && tags.length > 10) {
          throw new Error('Maximum 10 tags allowed');
        }
        if (tags) {
          for (const tag of tags) {
            if (typeof tag !== 'string' || tag.length > 20) {
              throw new Error('Each tag must be a string with maximum 20 characters');
            }
          }
        }
        return true;
      }),
  ],

  update: [
    param('id').isMongoId().withMessage('Invalid forum post ID format'),
    body('title')
      .optional()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    body('content')
      .optional()
      .isLength({ min: 10, max: 5000 })
      .withMessage('Content must be between 10 and 5000 characters'),
    body('category')
      .optional()
      .isIn([
        'general',
        'camping-tips',
        'equipment',
        'destinations',
        'safety',
        'reviews',
        'questions',
        'announcements',
      ])
      .withMessage('Invalid category'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
      .custom((tags) => {
        if (tags && tags.length > 10) {
          throw new Error('Maximum 10 tags allowed');
        }
        if (tags) {
          for (const tag of tags) {
            if (typeof tag !== 'string' || tag.length > 20) {
              throw new Error('Each tag must be a string with maximum 20 characters');
            }
          }
        }
        return true;
      }),
  ],

  delete: [param('id').isMongoId().withMessage('Invalid forum post ID format')],

  show: [param('id').isMongoId().withMessage('Invalid forum post ID format')],

  vote: [
    param('id').isMongoId().withMessage('Invalid forum post ID format'),
    body('voteType')
      .notEmpty()
      .withMessage('Vote type is required')
      .isIn(['upvote', 'downvote'])
      .withMessage('Vote type must be either upvote or downvote'),
  ],

  reply: [
    param('id').isMongoId().withMessage('Invalid forum post ID format'),
    body('content')
      .notEmpty()
      .withMessage('Reply content is required')
      .isLength({ min: 5, max: 2000 })
      .withMessage('Reply content must be between 5 and 2000 characters'),
  ],

  replyVote: [
    param('id').isMongoId().withMessage('Invalid forum post ID format'),
    param('replyIndex')
      .notEmpty()
      .withMessage('Reply index is required')
      .isInt({ min: 0 })
      .withMessage('Reply index must be a non-negative integer'),
    body('voteType')
      .notEmpty()
      .withMessage('Vote type is required')
      .isIn(['upvote', 'downvote'])
      .withMessage('Vote type must be either upvote or downvote'),
  ],

  acceptAnswer: [
    param('id').isMongoId().withMessage('Invalid forum post ID format'),
    param('replyIndex')
      .notEmpty()
      .withMessage('Reply index is required')
      .isInt({ min: 0 })
      .withMessage('Reply index must be a non-negative integer'),
  ],

  moderate: [
    param('id').isMongoId().withMessage('Invalid forum post ID format'),
    body('action')
      .notEmpty()
      .withMessage('Moderation action is required')
      .isIn(['pin', 'sticky', 'lock', 'close', 'delete'])
      .withMessage('Invalid moderation action'),
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason must not exceed 500 characters'),
  ],
};

// Individual validation functions for forum
const validateForumPost = validate(forumValidators.create);
const validateReply = validate(forumValidators.reply);

module.exports = {
  validate,
  campgroundValidators,
  reviewValidators,
  userValidators,
  bookingValidators,
  forumValidators,
  validateForumPost,
  validateReply,
};
