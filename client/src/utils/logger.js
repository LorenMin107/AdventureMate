// Secure frontend logger utility for React apps
// Only logs in development mode and sanitizes sensitive data

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

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
  if (isDev) {
    const sanitizedArgs = args.map((arg) => sanitizeData(arg));
    // eslint-disable-next-line no-console
    console.info(`[INFO] ${message}`, ...sanitizedArgs);
  }
}

export function logWarn(message, ...args) {
  if (isDev) {
    const sanitizedArgs = args.map((arg) => sanitizeData(arg));
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${message}`, ...sanitizedArgs);
  }
}

export function logError(message, ...args) {
  if (isDev) {
    const sanitizedArgs = args.map((arg) => sanitizeData(arg));
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${message}`, ...sanitizedArgs);
  }
}

export function logDebug(message, ...args) {
  if (isDev) {
    const sanitizedArgs = args.map((arg) => sanitizeData(arg));
    // eslint-disable-next-line no-console
    console.debug(`[DEBUG] ${message}`, ...sanitizedArgs);
  }
}
