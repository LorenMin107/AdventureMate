/**
 * Logger utility for standardized logging across the application
 * Provides different log levels and structured logging
 */

const config = require('../config');

// Define log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Get current log level from config or default to INFO
const currentLogLevel = config.server.logLevel || LOG_LEVELS.INFO;

/**
 * Format log message with timestamp, level, and context
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {string} - Formatted log message
 */
const formatLogMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const context = meta.context || '';
  const errorStack = meta.error?.stack || '';
  
  let formattedMessage = `[${timestamp}] [${level}]${context ? ` [${context}]` : ''}: ${message}`;
  
  // Add error stack trace if available
  if (errorStack) {
    formattedMessage += `\n${errorStack}`;
  }
  
  // Add additional metadata if available
  if (Object.keys(meta).length > 0 && !meta.error) {
    const metaString = JSON.stringify(meta, null, 2);
    formattedMessage += `\nMetadata: ${metaString}`;
  }
  
  return formattedMessage;
};

/**
 * Log an error message
 * @param {string} message - Error message
 * @param {Object} meta - Additional metadata
 */
const error = (message, meta = {}) => {
  if (currentLogLevel >= LOG_LEVELS.ERROR) {
    console.error(formatLogMessage('ERROR', message, meta));
  }
};

/**
 * Log a warning message
 * @param {string} message - Warning message
 * @param {Object} meta - Additional metadata
 */
const warn = (message, meta = {}) => {
  if (currentLogLevel >= LOG_LEVELS.WARN) {
    console.warn(formatLogMessage('WARN', message, meta));
  }
};

/**
 * Log an info message
 * @param {string} message - Info message
 * @param {Object} meta - Additional metadata
 */
const info = (message, meta = {}) => {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.info(formatLogMessage('INFO', message, meta));
  }
};

/**
 * Log a debug message
 * @param {string} message - Debug message
 * @param {Object} meta - Additional metadata
 */
const debug = (message, meta = {}) => {
  if (currentLogLevel >= LOG_LEVELS.DEBUG) {
    console.debug(formatLogMessage('DEBUG', message, meta));
  }
};

/**
 * Create a child logger with a specific context
 * @param {string} context - Logger context
 * @returns {Object} - Child logger
 */
const child = (context) => {
  return {
    error: (message, meta = {}) => error(message, { ...meta, context }),
    warn: (message, meta = {}) => warn(message, { ...meta, context }),
    info: (message, meta = {}) => info(message, { ...meta, context }),
    debug: (message, meta = {}) => debug(message, { ...meta, context }),
    child: (childContext) => child(`${context}:${childContext}`)
  };
};

module.exports = {
  LOG_LEVELS,
  error,
  warn,
  info,
  debug,
  child
};