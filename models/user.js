const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true, // unique already creates an index
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: false, // Make phone optional for OAuth users
    },
    // Add password field for JWT authentication
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    // New field to identify campground owners
    isOwner: {
      type: Boolean,
      default: false,
    },
    // Email verification fields
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
    },
    // Social login fields
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },

    profile: {
      name: {
        type: String,
      },
      picture: {
        type: String,
      },
    },
    // Account security fields
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    accountLocked: {
      type: Boolean,
      default: false,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
    },
    lastLoginIP: {
      type: String,
    },
    // Password history for audit logging
    passwordHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        ipAddress: {
          type: String,
        },
        userAgent: {
          type: String,
        },
        reason: {
          type: String,
          enum: ['reset', 'change', 'initial'],
          default: 'change',
        },
      },
    ],
    // Two-factor authentication fields
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      default: null,
    },
    twoFactorSetupCompleted: {
      type: Boolean,
      default: false,
    },
    backupCodes: [
      {
        code: {
          type: String,
        },
        isUsed: {
          type: Boolean,
          default: false,
        },
        usedAt: {
          type: Date,
          default: null,
        },
      },
    ],
    // References to owned campgrounds
    ownedCampgrounds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Campground',
      },
    ],
    bookings: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Booking',
      },
    ],
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    contacts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Contact',
      },
    ],
    // Add these fields for trip planner
    trips: [{ type: Schema.Types.ObjectId, ref: 'Trip' }],
    sharedTrips: [{ type: Schema.Types.ObjectId, ref: 'Trip' }],
  },
  { timestamps: true }
); // Add timestamps option

module.exports = mongoose.model('User', UserSchema);
