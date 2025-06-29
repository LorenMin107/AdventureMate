const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Refresh Token Schema
 * Stores refresh tokens for JWT authentication
 */
const RefreshTokenSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  revokedAt: {
    type: Date
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, { timestamps: true });

// Index for faster queries and automatic expiration
RefreshTokenSchema.index({ user: 1 });
RefreshTokenSchema.index({ expiresAt: 1 });

/**
 * Check if the token is expired
 */
RefreshTokenSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

/**
 * Check if the token is valid (not expired and not revoked)
 */
RefreshTokenSchema.methods.isValid = function() {
  return !this.isExpired() && !this.isRevoked;
};

/**
 * Revoke the token
 */
RefreshTokenSchema.methods.revoke = function() {
  this.isRevoked = true;
  this.revokedAt = new Date();
  return this.save();
};

/**
 * Find a valid token for a user
 */
RefreshTokenSchema.statics.findValidToken = function(token) {
  return this.findOne({
    token,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  });
};

/**
 * Revoke all tokens for a user
 */
RefreshTokenSchema.statics.revokeAllUserTokens = function(userId) {
  return this.updateMany(
    { user: userId, isRevoked: false },
    { isRevoked: true, revokedAt: new Date() }
  );
};

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
