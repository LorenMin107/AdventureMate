# Error Handling Strategy

This document outlines the standardized error handling approach used in the MyanCamp application.

## Overview

The error handling strategy is designed to:
- Provide consistent error responses across all API endpoints
- Standardize error logging with appropriate context
- Classify errors properly for better debugging and user experience
- Reduce boilerplate code in controllers

## Components

### 1. Error Classes

The application uses the following error classes:

- **ExpressError**: Base error class that extends the built-in Error class
  - Includes statusCode and isOperational properties
  - Provides static methods for creating common error types (badRequest, unauthorized, etc.)

### 2. Logging Service

The centralized logging service (`utils/logger.js`) provides:
- Different log levels (ERROR, WARN, INFO, DEBUG)
- Structured logging with timestamps and context
- Child loggers for specific components
- Metadata support for additional context

Example usage:
```javascript
const logger = require('./utils/logger').child('component-name');

// Log an error with metadata
logger.error('Something went wrong', { 
  userId: req.user._id,
  requestData: req.body
});

// Log info with context
logger.info('Operation successful', { operationId: '123' });
```

### 3. Error Handler Middleware

The error handler middleware (`utils/errorHandler.js`) provides:
- Centralized error handling for all routes
- Consistent error response format for API endpoints
- Different log levels based on error type
- Context tracking for better error tracing

### 4. Error Helper Functions

The error handler utility provides helper functions for creating specific types of errors:
- `validationError`: For validation errors (400 Bad Request)
- `notFoundError`: For resource not found errors (404 Not Found)
- `unauthorizedError`: For authentication errors (401 Unauthorized)
- `forbiddenError`: For permission errors (403 Forbidden)
- `serverError`: For internal server errors (500 Internal Server Error)

Example usage:
```javascript
const { notFoundError } = require('./utils/errorHandler');

// Throw a not found error
if (!user) {
  throw notFoundError('User', userId);
}
```

### 5. Async Handler

The `asyncHandler` function wraps async route handlers to catch errors and pass them to the error handler middleware:

```javascript
const { asyncHandler } = require('./utils/errorHandler');

module.exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw notFoundError('User', req.params.id);
  }
  
  return ApiResponse.success({ user }, 'User retrieved successfully').send(res);
});
```

## Error Response Format

API error responses follow this format:

```json
{
  "status": "error",
  "message": "User-friendly error message",
  "error": "Detailed error description",
  "data": null
}
```

## Best Practices

1. **Use asyncHandler for all async controller methods**
   - This eliminates the need for try-catch blocks in controllers

2. **Use appropriate error helper functions**
   - Match the error type to the situation (validation, not found, etc.)

3. **Include context in logs**
   - Add relevant IDs and data to help with debugging

4. **Use child loggers for specific components**
   - This adds component context to all logs from that component

5. **Don't catch errors unless you can handle them**
   - Let the error handler middleware handle unexpected errors

6. **Add validation early in the request lifecycle**
   - Validate input data before processing to catch errors early