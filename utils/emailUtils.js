const crypto = require('crypto');
const config = require('../config');
const EmailVerificationToken = require('../models/emailVerificationToken');
const { logError, logInfo, logDebug } = require('./logger');

// Default expiration time for email verification tokens
const EMAIL_VERIFICATION_TOKEN_EXPIRY = '24h'; // 24 hours

/**
 * Generate a random token string
 * @returns {string} Random token string
 */
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate an email verification token for a user
 * @param {Object} user - User object
 * @param {Object} req - Express request object
 * @param {string} expiresIn - Token expiration time (default: 24h)
 * @returns {Promise<Object>} Email verification token object
 */
const generateEmailVerificationToken = async (
  user,
  req,
  expiresIn = EMAIL_VERIFICATION_TOKEN_EXPIRY
) => {
  logInfo('Generating email verification token', { 
      userId: user._id 
    });

  // Generate a random token
  const tokenString = generateRandomToken();
  logDebug('Generated token string', { 
      tokenLength: tokenString.length 
    });

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
  logDebug('Token expiration set', { 
      expiresAt: expiresAt.toISOString() 
    });

  // Invalidate all existing tokens for this user
  logInfo('Invalidating existing tokens', { 
      userId: user._id 
    });
  await EmailVerificationToken.invalidateAllUserTokens(user._id);

  // Create a new email verification token
  const verificationToken = new EmailVerificationToken({
    user: user._id,
    email: user.email,
    token: tokenString,
    expiresAt,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  // Save the email verification token to the database
  logDebug('Saving token to database');
  await verificationToken.save();
  logInfo('Token saved to database');

  return {
    token: tokenString,
    expiresAt,
  };
};

/**
 * Check if a token exists but has been used
 * @param {string} token - Email verification token string
 * @returns {Promise<Object|null>} Email verification token document or null if not found
 */
const findUsedToken = async (token) => {
  logDebug('Checking if token has been used', { 
      tokenLength: token.length 
    });

  const usedToken = await EmailVerificationToken.findOne({
    token,
    isUsed: true,
  });

  if (usedToken) {
    logInfo('Token found but has been used', { 
      tokenId: usedToken._id,
      userId: usedToken.user 
    });
  }

  return usedToken;
};

/**
 * Verify an email verification token
 * @param {string} token - Email verification token string
 * @returns {Promise<Object>} Email verification token document
 * @throws {Error} If token is invalid
 */
const verifyEmailToken = async (token) => {
  logDebug('Verifying email token', { 
      tokenLength: token.length 
    });

  const verificationToken = await EmailVerificationToken.findValidToken(token);

  if (!verificationToken) {
    // Check if token exists but has been used
    const usedToken = await findUsedToken(token);

    if (usedToken) {
      logInfo('Token has already been used');
      throw new Error(
        'This verification link has already been used. Your email may already be verified.'
      );
    }

    logInfo('Token not found or invalid');
    throw new Error('Invalid or expired verification token');
  }

  logInfo('Token found and valid', { 
      tokenId: verificationToken._id,
      userId: verificationToken.user 
    });
  return verificationToken;
};

/**
 * Mark an email verification token as used
 * @param {string} token - Email verification token string
 * @returns {Promise<boolean>} True if token was marked as used
 */
const markEmailTokenAsUsed = async (token) => {
  const verificationToken = await EmailVerificationToken.findOne({ token });

  if (!verificationToken) {
    return false;
  }

  await verificationToken.markAsUsed();
  return true;
};

/**
 * Generate a verification URL
 * @param {string} token - Email verification token string
 * @param {string} baseUrl - Base URL for the verification link
 * @returns {string} Verification URL
 */
const generateVerificationUrl = (token, baseUrl = config.server.clientUrl) => {
  logDebug('Generating verification URL');
  logDebug('Base URL from config', { 
      clientUrl: config.server.clientUrl 
    });
  logDebug('Base URL parameter', { 
      baseUrl 
    });

  // Ensure baseUrl is never undefined
  const safeBaseUrl = baseUrl || 'http://localhost:5173';
  logDebug('Safe base URL', { 
      safeBaseUrl 
    });

  // Ensure token is properly encoded in the URL
  const encodedToken = encodeURIComponent(token);
  logDebug('Encoded token', { 
      encodedToken 
    });

  const verificationUrl = `${safeBaseUrl}/verify-email?token=${encodedToken}`;
  logInfo('Generated verification URL', { 
      verificationUrl 
    });

  return verificationUrl;
};

module.exports = {
  generateEmailVerificationToken,
  verifyEmailToken,
  markEmailTokenAsUsed,
  generateVerificationUrl,
  findUsedToken,
  EMAIL_VERIFICATION_TOKEN_EXPIRY,
};
