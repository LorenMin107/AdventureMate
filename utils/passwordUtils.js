const crypto = require('crypto');
const config = require('../config');
const PasswordResetToken = require('../models/passwordResetToken');
const User = require('../models/user');

// Default expiration time for password reset tokens
const PASSWORD_RESET_TOKEN_EXPIRY = '1h'; // 1 hour

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
  console.log('Generating password reset token for user:', user._id);

  // Generate a random token
  const tokenString = generateRandomToken();
  console.log('Generated token string:', tokenString);

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now
  console.log('Token expires at:', expiresAt);

  // Invalidate all existing tokens for this user
  console.log('Invalidating existing tokens for user:', user._id);
  await PasswordResetToken.invalidateAllUserTokens(user._id);

  // Create a new password reset token
  const resetToken = new PasswordResetToken({
    user: user._id,
    email: user.email,
    token: tokenString,
    expiresAt,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  // Save the password reset token to the database
  console.log('Saving token to database');
  await resetToken.save();
  console.log('Token saved to database');

  return {
    token: tokenString,
    expiresAt
  };
};

/**
 * Check if a token exists but has been used
 * @param {string} token - Password reset token string
 * @returns {Promise<Object|null>} Password reset token document or null if not found
 */
const findUsedToken = async (token) => {
  console.log('Checking if token has been used:', token);

  const usedToken = await PasswordResetToken.findOne({
    token,
    isUsed: true
  });

  if (usedToken) {
    console.log('Token found but has been used:', usedToken);
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
  console.log('Verifying password reset token:', token);

  const resetToken = await PasswordResetToken.findValidToken(token);

  if (!resetToken) {
    // Check if token exists but has been used
    const usedToken = await findUsedToken(token);

    if (usedToken) {
      console.log('Token has already been used');
      throw new Error('This password reset link has already been used. Please request a new one if needed.');
    }

    console.log('Token not found or invalid');
    throw new Error('Invalid or expired password reset token');
  }

  console.log('Token found and valid:', resetToken);
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
  console.log('Generating password reset URL');
  console.log('Base URL from config:', config.server.clientUrl);
  console.log('Base URL parameter:', baseUrl);

  // Ensure baseUrl is never undefined
  const safeBaseUrl = baseUrl || 'http://localhost:5173';
  console.log('Safe base URL:', safeBaseUrl);

  // Ensure token is properly encoded in the URL
  const encodedToken = encodeURIComponent(token);
  console.log('Encoded token:', encodedToken);

  const resetUrl = `${safeBaseUrl}/reset-password?token=${encodedToken}`;
  console.log('Generated password reset URL:', resetUrl);

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
      message: 'Password must be at least 8 characters long'
    };
  }

  // Check if password contains at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }

  // Check if password contains at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }

  // Check if password contains at least one number
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number'
    };
  }

  // Check if password contains at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character'
    };
  }

  return {
    isValid: true,
    message: 'Password meets strength requirements'
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
      console.error('User not found for audit log:', userId);
      return;
    }

    // Add a password change event to the user's history
    // This could be expanded to a separate collection for more detailed audit logging
    const passwordChangeEvent = {
      date: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      reason
    };

    // If the user doesn't have a passwordHistory array, create one
    if (!user.passwordHistory) {
      user.passwordHistory = [];
    }

    // Add the event to the user's password history
    user.passwordHistory.push(passwordChangeEvent);

    // Save the user
    await user.save();
    console.log('Password change audit log created for user:', userId);
  } catch (error) {
    console.error('Error creating password change audit log:', error);
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
  PASSWORD_RESET_TOKEN_EXPIRY
};