const crypto = require('crypto');
const bcrypt = require('bcrypt');
const config = require('../config');
const PasswordResetToken = require('../models/passwordResetToken');
const User = require('../models/user');
const { logError, logInfo, logWarn, logDebug } = require('./logger');

// Default expiration time for password reset tokens
const PASSWORD_RESET_TOKEN_EXPIRY = '1h'; // 1 hour
const SALT_ROUNDS = 12; // Number of salt rounds for bcrypt

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  try {
    logDebug('Hashing password');
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    logInfo('Password hashed successfully');
    return hashedPassword;
  } catch (error) {
    logError('Error hashing password', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password to compare against
 * @returns {Promise<boolean>} True if passwords match
 */
const comparePassword = async (password, hashedPassword) => {
  try {
    logDebug('Comparing password');

    // Check if password or hash is missing
    if (!password || !hashedPassword) {
      logWarn('Password comparison failed - missing password or hash', {
        hasPassword: !!password,
        hasHash: !!hashedPassword,
      });
      return false;
    }

    // Check if hash is in bcrypt format
    if (!hashedPassword.startsWith('$2b$')) {
      logWarn('Password hash is not in bcrypt format', {
        hashPrefix: hashedPassword.substring(0, 10) + '...',
      });
      return false;
    }

    const isMatch = await bcrypt.compare(password, hashedPassword);
    logInfo('Password comparison completed', { isMatch });
    return isMatch;
  } catch (error) {
    logError('Error comparing password', error);
    throw new Error('Failed to compare password');
  }
};

/**
 * Generate a random token string
 * @returns {string} Random token string
 */
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate a password reset token for a user
 * @param {Object} user - User object
 * @param {Object} req - Express request object
 * @param {string} expiresIn - Token expiration time (default: 1h)
 * @returns {Promise<Object>} Password reset token object
 */
const generatePasswordResetToken = async (user, req, expiresIn = PASSWORD_RESET_TOKEN_EXPIRY) => {
  logInfo('Generating password reset token', {
    userId: user._id,
  });

  // Generate a random token
  const tokenString = generateRandomToken();
  logDebug('Generated token string', {
    tokenLength: tokenString.length,
  });

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now
  logDebug('Token expiration set', {
    expiresAt: expiresAt.toISOString(),
  });

  // Invalidate all existing tokens for this user
  logInfo('Invalidating existing tokens', {
    userId: user._id,
  });
  await PasswordResetToken.invalidateAllUserTokens(user._id);

  // Create a new password reset token
  const resetToken = new PasswordResetToken({
    user: user._id,
    email: user.email,
    token: tokenString,
    expiresAt,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  // Save the password reset token to the database
  logDebug('Saving token to database');
  await resetToken.save();
  logInfo('Token saved to database');

  return {
    token: tokenString,
    expiresAt,
  };
};

/**
 * Check if a token exists but has been used
 * @param {string} token - Password reset token string
 * @returns {Promise<Object|null>} Password reset token document or null if not found
 */
const findUsedToken = async (token) => {
  logDebug('Checking if token has been used', {
    tokenLength: token.length,
  });

  const usedToken = await PasswordResetToken.findOne({
    token,
    isUsed: true,
  });

  if (usedToken) {
    logInfo('Token found but has been used', {
      tokenId: usedToken._id,
      userId: usedToken.user,
    });
  }

  return usedToken;
};

/**
 * Verify a password reset token
 * @param {string} token - Password reset token string
 * @returns {Promise<Object>} Password reset token document
 * @throws {Error} If token is invalid
 */
const verifyPasswordResetToken = async (token) => {
  logDebug('Verifying password reset token', {
    tokenLength: token.length,
  });

  const resetToken = await PasswordResetToken.findValidToken(token);

  if (!resetToken) {
    // Check if token exists but has been used
    const usedToken = await findUsedToken(token);

    if (usedToken) {
      logInfo('Token has already been used');
      throw new Error(
        'This password reset link has already been used. Please request a new one if needed.'
      );
    }

    logInfo('Token not found or invalid');
    throw new Error('Invalid or expired password reset token');
  }

  logInfo('Token found and valid', {
    tokenId: resetToken._id,
    userId: resetToken.user,
  });
  return resetToken;
};

/**
 * Mark a password reset token as used
 * @param {string} token - Password reset token string
 * @returns {Promise<boolean>} True if token was marked as used
 */
const markPasswordResetTokenAsUsed = async (token) => {
  const resetToken = await PasswordResetToken.findOne({ token });

  if (!resetToken) {
    return false;
  }

  await resetToken.markAsUsed();
  return true;
};

/**
 * Generate a password reset URL
 * @param {string} token - Password reset token string
 * @param {string} baseUrl - Base URL for the reset link
 * @returns {string} Password reset URL
 */
const generatePasswordResetUrl = (token, baseUrl = config.server.clientUrl) => {
  logDebug('Generating password reset URL');
  logDebug('Base URL from config', {
    clientUrl: config.server.clientUrl,
  });
  logDebug('Base URL parameter', {
    baseUrl,
  });

  // Ensure baseUrl is never undefined
  const safeBaseUrl = baseUrl || 'http://localhost:5173';
  logDebug('Safe base URL', {
    safeBaseUrl,
  });

  // Ensure token is properly encoded in the URL
  const encodedToken = encodeURIComponent(token);
  logDebug('Encoded token', {
    encodedToken,
  });

  const resetUrl = `${safeBaseUrl}/reset-password?token=${encodedToken}`;
  logInfo('Generated password reset URL', {
    resetUrl,
  });

  return resetUrl;
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message properties
 */
const validatePasswordStrength = (password) => {
  // Check if password is at least 8 characters long
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
    };
  }

  // Check if password contains at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter',
    };
  }

  // Check if password contains at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter',
    };
  }

  // Check if password contains at least one number
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
    };
  }

  // Check if password contains at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character',
    };
  }

  return {
    isValid: true,
    message: 'Password meets strength requirements',
  };
};

/**
 * Create a password change audit log
 * @param {string} userId - User ID
 * @param {Object} req - Express request object
 * @param {string} reason - Reason for password change (e.g., 'reset', 'change')
 * @returns {Promise<void>}
 */
const createPasswordChangeAuditLog = async (userId, req, reason) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      logError('User not found for audit log', null, {
        userId,
      });
      return;
    }

    // Add a password change event to the user's history
    // This could be expanded to a separate collection for more detailed audit logging
    const passwordChangeEvent = {
      date: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      reason,
    };

    // If the user doesn't have a passwordHistory array, create one
    if (!user.passwordHistory) {
      user.passwordHistory = [];
    }

    // Add the event to the user's password history
    user.passwordHistory.push(passwordChangeEvent);

    // Save the user
    await user.save();
    logInfo('Password change audit log created', {
      userId,
    });
  } catch (error) {
    logError('Error creating password change audit log', error, {
      userId,
    });
  }
};

module.exports = {
  generatePasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetTokenAsUsed,
  generatePasswordResetUrl,
  findUsedToken,
  validatePasswordStrength,
  createPasswordChangeAuditLog,
  hashPassword,
  comparePassword,
  PASSWORD_RESET_TOKEN_EXPIRY,
};
