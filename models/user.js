const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
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
  backupCodes: [{
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
    }
  }],
  // References to owned campgrounds
  ownedCampgrounds: [
    {
      type: Schema.Types.ObjectId,
      ref: "Campground",
    },
  ],
  bookings: [
    {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
  ],
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  contacts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Contact",
    },
  ],
});

// add the passport-local-mongoose plugin to the UserSchema to hash and salt the password and save the user to the database
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
