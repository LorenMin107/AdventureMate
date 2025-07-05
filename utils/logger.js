/**
 * Logger utility for standardized logging across the application
 * Provides different log levels and structured logging
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(
    ({ timestamp, level, message, requestId, userId, method, url, duration, ...meta }) => {
      const baseLog = {
        timestamp,
        level,
        message,
        ...(requestId && { requestId }),
        ...(userId && { userId }),
        ...(method && { method }),
        ...(url && { url }),
        ...(duration && { duration }),
        ...meta,
      };

      return JSON.stringify(baseLog);
    }
  )
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.printf(
    ({ timestamp, level, message, requestId, userId, method, url, duration, ...meta }) => {
      const baseInfo = `${timestamp} [${level}]`;
      const requestInfo = requestId ? `[${requestId}]` : '';
      const userInfo = userId ? `[User: ${userId}]` : '';
      const methodInfo = method ? `[${method} ${url}]` : '';
      const durationInfo = duration ? `[${duration}ms]` : '';

      return `${baseInfo} ${requestInfo} ${userInfo} ${methodInfo} ${durationInfo} ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    }
  )
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'myancamp' },
  transports: [
    // Error logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    }),

    // Combined logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    }),

    // Debug logs (development only)
    ...(process.env.NODE_ENV !== 'production'
      ? [
          new DailyRotateFile({
            filename: path.join(logsDir, 'debug-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'debug',
            maxSize: '20m',
            maxFiles: '7d',
            format: logFormat,
          }),
        ]
      : []),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Request ID generator
const generateRequestId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Middleware to add request ID and logging context
const requestLogger = (req, res, next) => {
  // Generate request ID
  req.requestId = generateRequestId();

  // Add request start time
  req.startTime = Date.now();

  // Log request start
  logger.info('Request started', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id,
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const duration = Date.now() - req.startTime;

    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userId: req.user?._id,
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Helper functions for different log levels
const logInfo = (message, meta = {}) => {
  logger.info(message, meta);
};

const logError = (message, error = null, meta = {}) => {
  const logData = {
    ...meta,
    ...(error && {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    }),
  };
  logger.error(message, logData);
};

const logWarn = (message, meta = {}) => {
  logger.warn(message, meta);
};

const logDebug = (message, meta = {}) => {
  logger.debug(message, meta);
};

// Database operation logger
const logDatabase = (operation, collection, query = {}, duration = null, error = null) => {
  const meta = {
    operation,
    collection,
    query: JSON.stringify(query),
    ...(duration && { duration }),
    ...(error && { error: error.message }),
  };

  if (error) {
    logger.error(`Database ${operation} failed`, meta);
  } else {
    logger.debug(`Database ${operation} completed`, meta);
  }
};

// API operation logger
const logApi = (operation, endpoint, params = {}, duration = null, error = null) => {
  const meta = {
    operation,
    endpoint,
    params: JSON.stringify(params),
    ...(duration && { duration }),
    ...(error && { error: error.message }),
  };

  if (error) {
    logger.error(`API ${operation} failed`, meta);
  } else {
    logger.info(`API ${operation} completed`, meta);
  }
};

// Authentication logger
const logAuth = (action, userId = null, success = true, error = null) => {
  const meta = {
    action,
    ...(userId && { userId }),
    success,
    ...(error && { error: error.message }),
  };

  if (success) {
    logger.info(`Authentication ${action} successful`, meta);
  } else {
    logger.warn(`Authentication ${action} failed`, meta);
  }
};

// Security logger
const logSecurity = (event, details = {}) => {
  logger.warn(`Security event: ${event}`, details);
};

// Performance logger
const logPerformance = (operation, duration, details = {}) => {
  const meta = {
    operation,
    duration,
    ...details,
  };

  if (duration > 1000) {
    logger.warn('Slow operation detected', meta);
  } else {
    logger.debug('Operation completed', meta);
  }
};

module.exports = {
  logger,
  requestLogger,
  logInfo,
  logError,
  logWarn,
  logDebug,
  logDatabase,
  logApi,
  logAuth,
  logSecurity,
  logPerformance,
  generateRequestId,
};
