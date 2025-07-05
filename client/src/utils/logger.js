// Simple frontend logger utility for React apps
// Only logs in development mode by default

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

export function logInfo(message, ...args) {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.info(`[INFO] ${message}`, ...args);
  }
}

export function logWarn(message, ...args) {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${message}`, ...args);
  }
}

export function logError(message, ...args) {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${message}`, ...args);
  }
}

export function logDebug(message, ...args) {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.debug(`[DEBUG] ${message}`, ...args);
  }
}
