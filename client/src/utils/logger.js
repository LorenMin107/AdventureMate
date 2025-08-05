// Secure frontend logger utility for React apps
// Only logs in development mode and sanitizes sensitive data

const isDev = false; // Disable all logging for production

// Sanitize sensitive data before logging
function sanitizeData(data) {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };
  const sensitiveFields = [
    '_id',
    'id',
    'userId',
    'authorId',
    'reviewId',
    'campgroundId',
    'username',
    'email',
    'token',
    'password',
  ];

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

export function logInfo(message, ...args) {
  // Logging disabled for production
}

export function logWarn(message, ...args) {
  // Logging disabled for production
}

export function logError(message, ...args) {
  // Logging disabled for production
}

export function logDebug(message, ...args) {
  // Logging disabled for production
}
