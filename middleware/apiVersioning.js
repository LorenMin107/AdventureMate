const { logWarn, logInfo, logDebug } = require('../utils/logger');

/**
 * Middleware to add deprecation notice to response headers
 * @param {Object} options - Options for the deprecation notice
 * @param {string} options.message - Deprecation message
 * @param {string} options.version - Version when the endpoint will be removed
 * @param {string} options.alternativeUrl - URL of the alternative endpoint
 * @returns {Function} Express middleware
 */
const deprecateEndpoint = (options = {}) => {
  const { message = 'This endpoint is deprecated', version = 'v2', alternativeUrl } = options;

  const deprecationMessage = alternativeUrl
    ? `${message}. Please use ${alternativeUrl} instead.`
    : message;

  return (req, res, next) => {
    // Add deprecation notice to response headers
    res.set('X-API-Deprecated', 'true');
    res.set('X-API-Deprecation-Message', deprecationMessage);
    res.set('X-API-Deprecation-Version', version);

    if (alternativeUrl) {
      res.set('X-API-Alternative-URL', alternativeUrl);
    }

    // Log deprecation warning
    logWarn(`Deprecated endpoint accessed: ${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user ? req.user._id : 'unauthenticated',
      deprecationMessage,
      alternativeUrl,
    });

    next();
  };
};

/**
 * Middleware to handle API versioning
 * @param {Object} options - Options for the versioning
 * @param {string} options.defaultVersion - Default API version
 * @returns {Function} Express middleware
 */
const versionRoutes = (options = {}) => {
  const { defaultVersion = 'v1' } = options;

  return (req, res, next) => {
    // Extract version from URL path
    const urlParts = req.originalUrl.split('/');
    const versionIndex = urlParts.findIndex((part) => part === 'api') + 1;

    // If version is specified in URL, use it; otherwise use default
    const version =
      urlParts[versionIndex] && urlParts[versionIndex].startsWith('v')
        ? urlParts[versionIndex]
        : defaultVersion;

    // Add version to request object for use in controllers
    req.apiVersion = version;

    // Add version to response headers
    res.set('X-API-Version', version);

    next();
  };
};

module.exports = {
  deprecateEndpoint,
  versionRoutes,
};
