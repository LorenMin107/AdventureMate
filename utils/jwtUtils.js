const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const RefreshToken = require('../models/refreshToken');

// Default expiration times
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

/**
 * Generate a random token string
 * @returns {string} Random token string
 */
const generateRandomToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Generate an access token for a user
 * @param {Object} user - User object
 * @param {string} expiresIn - Token expiration time (default: 15m)
 * @returns {string} JWT access token
 */
const generateAccessToken = (user, expiresIn = ACCESS_TOKEN_EXPIRY) => {
  const payload = {
    sub: user._id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin || false,
    isOwner: user.isOwner || false,
    type: 'access'
  };

  return jwt.sign(
    payload,
    config.jwt.accessTokenSecret,
    { expiresIn }
  );
};

/**
 * Generate a refresh token for a user and save it to the database
 * @param {Object} user - User object
 * @param {Object} req - Express request object
 * @param {string} expiresIn - Token expiration time (default: 7d)
 * @returns {Object} Refresh token object
 */
const generateRefreshToken = async (user, req, expiresIn = REFRESH_TOKEN_EXPIRY) => {
  // Generate a random token
  const tokenString = generateRandomToken();
  
  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
  
  // Create a new refresh token
  const refreshToken = new RefreshToken({
    user: user._id,
    token: tokenString,
    expiresAt,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  });
  
  // Save the refresh token to the database
  await refreshToken.save();
  
  return {
    token: tokenString,
    expiresAt
  };
};

/**
 * Verify an access token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.accessTokenSecret);
  } catch (error) {
    throw error;
  }
};

/**
 * Verify a refresh token
 * @param {string} token - Refresh token string
 * @returns {Promise<Object>} Refresh token document
 * @throws {Error} If token is invalid
 */
const verifyRefreshToken = async (token) => {
  const refreshToken = await RefreshToken.findValidToken(token);
  
  if (!refreshToken) {
    throw new Error('Invalid refresh token');
  }
  
  return refreshToken;
};

/**
 * Revoke a refresh token
 * @param {string} token - Refresh token string
 * @returns {Promise<boolean>} True if token was revoked
 */
const revokeRefreshToken = async (token) => {
  const refreshToken = await RefreshToken.findOne({ token });
  
  if (!refreshToken) {
    return false;
  }
  
  await refreshToken.revoke();
  return true;
};

/**
 * Revoke all refresh tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result of the operation
 */
const revokeAllUserTokens = async (userId) => {
  return await RefreshToken.revokeAllUserTokens(userId);
};

/**
 * Extract token from authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} Token or null if not found
 */
const extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  extractTokenFromHeader,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
};