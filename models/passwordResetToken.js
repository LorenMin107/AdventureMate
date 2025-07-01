const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Password Reset Token Schema
 * Stores tokens for password reset requests
 */
const PasswordResetTokenSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
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
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
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
PasswordResetTokenSchema.index({ user: 1 });
PasswordResetTokenSchema.index({ expiresAt: 1 });
PasswordResetTokenSchema.index({ email: 1 });

/**
 * Check if the token is expired
 */
PasswordResetTokenSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

/**
 * Check if the token is valid (not expired and not used)
 */
PasswordResetTokenSchema.methods.isValid = function() {
  return !this.isExpired() && !this.isUsed;
};

/**
 * Mark the token as used
 */
PasswordResetTokenSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  this.usedAt = new Date();
  return this.save();
};

/**
 * Find a valid token for a user
 */
PasswordResetTokenSchema.statics.findValidToken = function(token) {
  console.log('Finding valid password reset token in database:', token);
  console.log('Current time:', new Date());

  return this.findOne({
    token,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).then(result => {
    if (result) {
      console.log('Token found in database:', result);
      console.log('Token expires at:', result.expiresAt);
      console.log('Token is used:', result.isUsed);
    } else {
      console.log('No valid token found in database with this token string');
    }
    return result;
  });
};

/**
 * Find the most recent valid token for a user
 */
PasswordResetTokenSchema.statics.findLatestValidToken = function(userId) {
  return this.findOne({
    user: userId,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

/**
 * Invalidate all tokens for a user
 */
PasswordResetTokenSchema.statics.invalidateAllUserTokens = function(userId) {
  return this.updateMany(
    { user: userId, isUsed: false },
    { isUsed: true, usedAt: new Date() }
  );
};

module.exports = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);