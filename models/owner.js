const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OwnerSchema = new Schema(
  {
    // Reference to the user account
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Business Information
    businessName: {
      type: String,
      required: true,
      trim: true,
    },

    businessType: {
      type: String,
      enum: ['individual', 'company', 'organization'],
      required: true,
    },

    businessRegistrationNumber: {
      type: String,
      trim: true,
    },

    taxId: {
      type: String,
      trim: true,
    },

    // Contact Information
    businessAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true, default: 'Myanmar' },
    },

    businessPhone: {
      type: String,
      required: true,
    },

    businessEmail: {
      type: String,
      required: true,
    },

    // Verification Status
    verificationStatus: {
      type: String,
      enum: ['pending', 'under_review', 'verified', 'rejected', 'suspended'],
      default: 'pending',
    },

    verificationDocuments: [
      {
        type: {
          type: String,
          enum: [
            'business_license',
            'tax_certificate',
            'identity_document',
            'property_ownership',
            'other',
          ],
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
        rejectionReason: String,
      },
    ],

    verificationNotes: [
      {
        note: {
          type: String,
          required: true,
        },
        addedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: ['admin_note', 'system_note', 'owner_note'],
          default: 'admin_note',
        },
      },
    ],

    verifiedAt: {
      type: Date,
    },

    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    // Verification Token for email verification
    verificationToken: {
      type: String,
    },

    verificationTokenExpires: {
      type: Date,
    },

    // Banking Information (for payments)
    bankingInfo: {
      accountHolderName: String,
      bankName: String,
      accountNumber: String,
      routingNumber: String,
      swiftCode: String,
      verified: {
        type: Boolean,
        default: false,
      },
    },

    // Owner Settings
    settings: {
      autoApproveBookings: {
        type: Boolean,
        default: false,
      },
      allowInstantBooking: {
        type: Boolean,
        default: true,
      },
      cancellationPolicy: {
        type: String,
        enum: ['flexible', 'moderate', 'strict'],
        default: 'moderate',
      },
      minimumStay: {
        type: Number,
        default: 1,
      },
      maximumStay: {
        type: Number,
        default: 30,
      },
      checkInTime: {
        type: String,
        default: '15:00',
      },
      checkOutTime: {
        type: String,
        default: '11:00',
      },
    },

    // Performance Metrics
    metrics: {
      totalBookings: {
        type: Number,
        default: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        default: 0,
      },
      responseRate: {
        type: Number,
        default: 0,
      },
      responseTime: {
        type: Number, // in hours
        default: 0,
      },
    },

    // References to owned campgrounds
    campgrounds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Campground',
      },
    ],

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },

    suspendedAt: {
      type: Date,
    },

    suspendedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    suspensionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
OwnerSchema.index({ user: 1 });
OwnerSchema.index({ verificationStatus: 1 });
OwnerSchema.index({ businessName: 'text' });
OwnerSchema.index({ 'businessAddress.city': 1 });
OwnerSchema.index({ 'businessAddress.state': 1 });

// Virtual for full business address
OwnerSchema.virtual('fullBusinessAddress').get(function () {
  if (!this.businessAddress) return '';
  const addr = this.businessAddress;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Virtual for verification status display
OwnerSchema.virtual('verificationStatusDisplay').get(function () {
  const statusMap = {
    pending: 'Pending Verification',
    under_review: 'Under Review',
    verified: 'Verified',
    rejected: 'Verification Rejected',
    suspended: 'Account Suspended',
  };
  return statusMap[this.verificationStatus] || this.verificationStatus;
});

// Method to check if owner can manage campgrounds
OwnerSchema.methods.canManageCampgrounds = function () {
  return this.verificationStatus === 'verified' && this.isActive;
};

// Method to update metrics
OwnerSchema.methods.updateMetrics = async function () {
  const Booking = require('./booking');
  const Review = require('./review');

  // Calculate total bookings and revenue (include cancelled bookings in revenue since no refunds are given)
  const bookingStats = await Booking.aggregate([
    {
      $match: {
        campground: { $in: this.campgrounds },
        status: { $in: ['confirmed', 'cancelled'] },
        paid: true,
      },
    },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
      },
    },
  ]);

  if (bookingStats.length > 0) {
    this.metrics.totalBookings = bookingStats[0].totalBookings;
    this.metrics.totalRevenue = bookingStats[0].totalRevenue;
  }

  // Calculate average rating
  const ratingStats = await Review.aggregate([
    {
      $lookup: {
        from: 'campgrounds',
        localField: 'campground',
        foreignField: '_id',
        as: 'campgroundData',
      },
    },
    {
      $match: {
        'campgroundData.owner': this.user,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  if (ratingStats.length > 0) {
    this.metrics.averageRating = Math.round(ratingStats[0].averageRating * 10) / 10;
  }

  await this.save();
};

module.exports = mongoose.model('Owner', OwnerSchema);
