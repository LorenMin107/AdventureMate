const User = require('../models/user');

/**
 * Middleware to check if an account is locked before attempting authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const checkAccountLockout = async (req, res, next) => {
  try {
    const { username } = req.body;

    // Skip if no username provided
    if (!username) {
      return next();
    }

    // Find the user by username
    const user = await User.findOne({ username });

    // If user doesn't exist, continue to regular auth flow (which will fail)
    if (!user) {
      return next();
    }

    // Check if account is locked
    if (user.accountLocked) {
      // Check if lock period has expired
      if (user.lockUntil && user.lockUntil < new Date()) {
        // Reset lockout status if lock period has expired
        user.accountLocked = false;
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();
        return next();
      }

      // Account is still locked
      return res.status(401).json({
        error: 'Account locked',
        message: 'Your account has been temporarily locked due to multiple failed login attempts. Please try again later.',
        lockUntil: user.lockUntil
      });
    }

    // Account is not locked, continue to authentication
    next();
  } catch (error) {
    console.error('Error checking account lockout:', error);
    next(error);
  }
};

/**
 * Middleware to handle failed login attempts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleFailedLogin = async (req, res, next) => {
  try {
    const { username } = req.body;

    // Skip if no username provided
    if (!username) {
      return next();
    }

    // Find the user by username
    const user = await User.findOne({ username });

    // If user doesn't exist, continue to regular auth flow
    if (!user) {
      return next();
    }

    // Increment failed login attempts
    user.failedLoginAttempts += 1;

    // Check if account should be locked (after 5 failed attempts)
    if (user.failedLoginAttempts >= 5) {
      user.accountLocked = true;
      // Lock account for 30 minutes
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);

      await user.save();

      return res.status(401).json({
        error: 'Account locked',
        message: 'Your account has been temporarily locked due to multiple failed login attempts. Please try again in 30 minutes.',
        lockUntil: user.lockUntil
      });
    }

    await user.save();

    // Continue to regular auth error handling
    next();
  } catch (error) {
    console.error('Error handling failed login:', error);
    next(error);
  }
};

/**
 * Middleware to reset failed login attempts after successful login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const resetFailedAttempts = async (req, res, next) => {
  try {
    // Skip if user is not authenticated
    if (!req.user) {
      return next();
    }

    // Reset failed login attempts
    req.user.failedLoginAttempts = 0;
    req.user.accountLocked = false;
    req.user.lockUntil = null;
    req.user.lastLoginAt = new Date();
    req.user.lastLoginIP = req.ip;

    await req.user.save();

    // Continue to next middleware
    next();
  } catch (error) {
    console.error('Error resetting failed login attempts:', error);
    next(error);
  }
};

/**
 * Middleware to handle remember me functionality
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleRememberMe = (req, res, next) => {
  try {
    // Skip if user is not authenticated or rememberMe is not set
    if (!req.user || !req.body.rememberMe) {
      return next();
    }

    // Set session cookie to expire in 30 days instead of the default
    if (req.session) {
      // 30 days in milliseconds
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      req.session.cookie.maxAge = thirtyDays;
      req.session.cookie.expires = new Date(Date.now() + thirtyDays);

      // Save the session with the new expiration
      req.session.save();
    }

    // Continue to next middleware
    next();
  } catch (error) {
    console.error('Error handling remember me:', error);
    next(error);
  }
};

module.exports = {
  checkAccountLockout,
  handleFailedLogin,
  resetFailedAttempts,
  handleRememberMe
};
