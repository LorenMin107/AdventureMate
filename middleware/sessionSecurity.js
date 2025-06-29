const User = require('../models/user');

/**
 * Middleware to enhance session security
 * This middleware adds additional security checks to the session
 */

/**
 * Middleware to validate session based on IP address and user agent
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateSession = (req, res, next) => {
  try {
    console.log('validateSession middleware called');
    console.log('req.isAuthenticated():', req.isAuthenticated ? req.isAuthenticated() : 'Not available');
    console.log('req.user:', req.user ? req.user._id : 'No user');

    // Skip if user is not authenticated
    if (!req.user || !req.session) {
      console.log('User not authenticated or no session, skipping validation');
      return next();
    }

    // Get current IP and user agent
    const currentIP = req.ip;
    const currentUserAgent = req.get('User-Agent') || '';
    console.log('Current IP:', currentIP);
    console.log('Current User Agent:', currentUserAgent.substring(0, 50) + '...');

    // Check if this is the first request in the session
    if (!req.session.securityInfo) {
      console.log('First request in session, initializing security info');
      // Initialize security info
      req.session.securityInfo = {
        ipAddress: currentIP,
        userAgent: currentUserAgent,
        createdAt: new Date(),
        lastRotatedAt: new Date()
      };
      return next();
    }

    // Get stored security info
    const { ipAddress, userAgent } = req.session.securityInfo;
    console.log('Stored IP:', ipAddress);
    console.log('Stored User Agent:', userAgent ? userAgent.substring(0, 50) + '...' : 'None');

    // Temporarily disable IP validation for debugging
    /*
    // Validate IP address (if changed significantly)
    // This is a simple check - in production you might want more sophisticated IP validation
    if (ipAddress && ipAddress !== currentIP) {
      console.warn(`Session IP mismatch: ${ipAddress} vs ${currentIP}`);

      // For security, we'll invalidate the session if the IP changes dramatically
      // In a real app, you might want to implement additional checks or allow certain IP changes
      if (!isSimilarIP(ipAddress, currentIP)) {
        console.warn('IP change detected, invalidating session');
        req.logout((err) => {
          if (err) {
            return next(err);
          }
          return res.status(401).json({
            error: 'Session invalidated',
            message: 'Your session has been invalidated due to a significant change in your connection. Please log in again.'
          });
        });
        return;
      }
    }

    // Validate user agent (if changed)
    if (userAgent && userAgent !== currentUserAgent) {
      console.warn(`Session user agent mismatch: ${userAgent} vs ${currentUserAgent}`);

      // For security, we'll invalidate the session if the user agent changes
      req.logout((err) => {
        if (err) {
          return next(err);
        }
        return res.status(401).json({
          error: 'Session invalidated',
          message: 'Your session has been invalidated due to a change in your browser. Please log in again.'
        });
      });
      return;
    }
    */

    // Update security info
    req.session.securityInfo.lastValidatedAt = new Date();
    console.log('Session validated successfully');

    // Continue to next middleware
    next();
  } catch (error) {
    console.error('Error validating session:', error);
    next(error);
  }
};

/**
 * Middleware to rotate session ID periodically
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const rotateSession = (req, res, next) => {
  try {
    console.log('rotateSession middleware called');

    // Skip if user is not authenticated
    if (!req.user || !req.session || !req.session.securityInfo) {
      console.log('User not authenticated, no session, or no security info, skipping rotation');
      return next();
    }

    const { lastRotatedAt } = req.session.securityInfo;
    const now = new Date();

    console.log('Last rotated at:', lastRotatedAt);
    console.log('Current time:', now);

    // Rotate session ID every 30 minutes
    const rotationInterval = 30 * 60 * 1000; // 30 minutes in milliseconds

    if (lastRotatedAt && (now - new Date(lastRotatedAt)) > rotationInterval) {
      console.log('Session rotation interval exceeded, regenerating session');

      // Store important session data
      const securityInfo = req.session.securityInfo;

      // Regenerate session ID
      req.session.regenerate((err) => {
        if (err) {
          console.error('Error regenerating session:', err);
          return next(err);
        }

        console.log('Session regenerated successfully');

        // Restore user and security info
        req.session.passport = { user: req.user._id };
        req.session.securityInfo = {
          ...securityInfo,
          lastRotatedAt: now
        };

        next();
      });
    } else {
      console.log('Session rotation interval not exceeded, skipping rotation');
      next();
    }
  } catch (error) {
    console.error('Error rotating session:', error);
    next(error);
  }
};

/**
 * Helper function to check if two IP addresses are similar
 * This is a simple implementation - in production you might want more sophisticated IP validation
 * @param {string} ip1 - First IP address
 * @param {string} ip2 - Second IP address
 * @returns {boolean} - True if IPs are similar, false otherwise
 */
function isSimilarIP(ip1, ip2) {
  // For IPv4 addresses, check if the first two octets match
  // This is a very simple check - in production you might want more sophisticated IP validation
  if (ip1.includes('.') && ip2.includes('.')) {
    const ip1Parts = ip1.split('.');
    const ip2Parts = ip2.split('.');

    // Check if first two octets match (same subnet)
    return ip1Parts[0] === ip2Parts[0] && ip1Parts[1] === ip2Parts[1];
  }

  // For IPv6 or other formats, require exact match for now
  return ip1 === ip2;
}

module.exports = {
  validateSession,
  rotateSession
};
