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
    // User suspension fields
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    suspendedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    suspensionReason: {
      type: String,
      default: null,
    },
    suspensionExpiresAt: {
      type: Date,
      default: null,
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

// Post-delete middleware to clean up orphaned references
UserSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const { logInfo, logError } = require('../utils/logger');

    try {
      // Import models
      const Review = require('./review');
      const Campground = require('./campground');
      const Booking = require('./booking');
      const Trip = require('./trip');
      const SafetyAlert = require('./safetyAlert');
      const OwnerApplication = require('./ownerApplication');

      // Clean up reviews authored by this user
      const deletedReviews = await Review.deleteMany({ author: doc._id });
      logInfo('Cleaned up reviews after user deletion', {
        userId: doc._id,
        deletedReviews: deletedReviews.deletedCount,
      });

      // Remove review references from campgrounds
      const updatedCampgrounds = await Campground.updateMany(
        { reviews: { $in: doc.reviews } },
        { $pull: { reviews: { $in: doc.reviews } } }
      );
      logInfo('Removed review references from campgrounds', {
        userId: doc._id,
        updatedCampgrounds: updatedCampgrounds.modifiedCount,
      });

      // Clean up bookings by this user
      const deletedBookings = await Booking.deleteMany({ user: doc._id });
      logInfo('Cleaned up bookings after user deletion', {
        userId: doc._id,
        deletedBookings: deletedBookings.deletedCount,
      });

      // Clean up trips by this user
      const deletedTrips = await Trip.deleteMany({ user: doc._id });
      logInfo('Cleaned up trips after user deletion', {
        userId: doc._id,
        deletedTrips: deletedTrips.deletedCount,
      });

      // Clean up safety alerts by this user
      const deletedSafetyAlerts = await SafetyAlert.deleteMany({ createdBy: doc._id });
      logInfo('Cleaned up safety alerts after user deletion', {
        userId: doc._id,
        deletedSafetyAlerts: deletedSafetyAlerts.deletedCount,
      });

      // Clean up owner applications by this user
      const deletedApplications = await OwnerApplication.deleteMany({ user: doc._id });
      logInfo('Cleaned up owner applications after user deletion', {
        userId: doc._id,
        deletedApplications: deletedApplications.deletedCount,
      });

      // Remove user from shared trips
      const updatedSharedTrips = await Trip.updateMany(
        { sharedTrips: doc._id },
        { $pull: { sharedTrips: doc._id } }
      );
      logInfo('Removed user from shared trips', {
        userId: doc._id,
        updatedSharedTrips: updatedSharedTrips.modifiedCount,
      });

      // Remove user from trip collaborators
      const updatedCollaboratorTrips = await Trip.updateMany(
        { collaborators: doc._id },
        { $pull: { collaborators: doc._id } }
      );
      logInfo('Removed user from trip collaborators', {
        userId: doc._id,
        updatedCollaboratorTrips: updatedCollaboratorTrips.modifiedCount,
      });

      // Remove user acknowledgments from safety alerts
      const updatedSafetyAlerts = await SafetyAlert.updateMany(
        { 'acknowledgedBy.user': doc._id },
        { $pull: { acknowledgedBy: { user: doc._id } } }
      );
      logInfo('Removed user acknowledgments from safety alerts', {
        userId: doc._id,
        updatedSafetyAlerts: updatedSafetyAlerts.modifiedCount,
      });
    } catch (error) {
      logError('Error cleaning up orphaned references after user deletion', error, {
        userId: doc._id,
      });
    }
  }
});

module.exports = mongoose.model('User', UserSchema);
