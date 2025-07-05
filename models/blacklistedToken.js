const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Blacklisted Token Schema
 * Stores tokens that have been revoked and should no longer be valid
 */
const BlacklistedTokenSchema = new Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokenType: {
    type: String,
    enum: ['access', 'refresh'],
    required: true
  },
  blacklistedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Automatically remove document when expiresAt is reached
  },
  reason: {
    type: String,
    enum: ['logout', 'security_concern', 'token_refresh', 'user_request', 'admin_action'],
    default: 'logout'
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, { timestamps: true });

// Indexes for faster queries
BlacklistedTokenSchema.index({ token: 1 });
BlacklistedTokenSchema.index({ user: 1 });
BlacklistedTokenSchema.index({ blacklistedAt: 1 });

/**
 * Check if a token is blacklisted
 * @param {string} token - The token to check
 * @returns {Promise<boolean>} - True if the token is blacklisted
 */
BlacklistedTokenSchema.statics.isBlacklisted = async function(token) {
  const count = await this.countDocuments({ token });
  return count > 0;
};

/**
 * Add a token to the blacklist
 * @param {Object} tokenData - Token data
 * @param {string} tokenData.token - The token to blacklist
 * @param {string} tokenData.user - The user ID the token belongs to
 * @param {string} tokenData.tokenType - The type of token (access or refresh)
 * @param {Date} tokenData.expiresAt - When the token expires
 * @param {string} tokenData.reason - The reason for blacklisting
 * @param {string} tokenData.ipAddress - The IP address that initiated the blacklisting
 * @param {string} tokenData.userAgent - The user agent that initiated the blacklisting
 * @returns {Promise<Object>} - The blacklisted token document
 */
BlacklistedTokenSchema.statics.addToBlacklist = async function(tokenData) {
  // Check if token is already blacklisted
  const existing = await this.findOne({ token: tokenData.token });
  if (existing) {
    return existing;
  }
  
  // Create a new blacklisted token document
  return await this.create(tokenData);
};

module.exports = mongoose.model('BlacklistedToken', BlacklistedTokenSchema);