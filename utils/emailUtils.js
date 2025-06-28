const crypto = require('crypto');
const config = require('../config');
const EmailVerificationToken = require('../models/emailVerificationToken');

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
const generateEmailVerificationToken = async (user, req, expiresIn = EMAIL_VERIFICATION_TOKEN_EXPIRY) => {
  console.log('Generating email verification token for user:', user._id);

  // Generate a random token
  const tokenString = generateRandomToken();
  console.log('Generated token string:', tokenString);

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
  console.log('Token expires at:', expiresAt);

  // Invalidate all existing tokens for this user
  console.log('Invalidating existing tokens for user:', user._id);
  await EmailVerificationToken.invalidateAllUserTokens(user._id);

  // Create a new email verification token
  const verificationToken = new EmailVerificationToken({
    user: user._id,
    email: user.email,
    token: tokenString,
    expiresAt,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  // Save the email verification token to the database
  console.log('Saving token to database');
  await verificationToken.save();
  console.log('Token saved to database');

  return {
    token: tokenString,
    expiresAt
  };
};

/**
 * Check if a token exists but has been used
 * @param {string} token - Email verification token string
 * @returns {Promise<Object|null>} Email verification token document or null if not found
 */
const findUsedToken = async (token) => {
  console.log('Checking if token has been used:', token);

  const usedToken = await EmailVerificationToken.findOne({
    token,
    isUsed: true
  });

  if (usedToken) {
    console.log('Token found but has been used:', usedToken);
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
  console.log('Verifying email token:', token);

  const verificationToken = await EmailVerificationToken.findValidToken(token);

  if (!verificationToken) {
    // Check if token exists but has been used
    const usedToken = await findUsedToken(token);

    if (usedToken) {
      console.log('Token has already been used');
      throw new Error('This verification link has already been used. Your email may already be verified.');
    }

    console.log('Token not found or invalid');
    throw new Error('Invalid or expired verification token');
  }

  console.log('Token found and valid:', verificationToken);
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
  console.log('Generating verification URL');
  console.log('Base URL from config:', config.server.clientUrl);
  console.log('Base URL parameter:', baseUrl);

  // Ensure baseUrl is never undefined
  const safeBaseUrl = baseUrl || 'http://localhost:5173';
  console.log('Safe base URL:', safeBaseUrl);

  // Ensure token is properly encoded in the URL
  const encodedToken = encodeURIComponent(token);
  console.log('Encoded token:', encodedToken);

  const verificationUrl = `${safeBaseUrl}/verify-email?token=${encodedToken}`;
  console.log('Generated verification URL:', verificationUrl);

  return verificationUrl;
};

module.exports = {
  generateEmailVerificationToken,
  verifyEmailToken,
  markEmailTokenAsUsed,
  generateVerificationUrl,
  findUsedToken,
  EMAIL_VERIFICATION_TOKEN_EXPIRY
};
