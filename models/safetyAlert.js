const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SafetyAlertSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      required: true,
    },
    type: {
      type: String,
      enum: ['weather', 'wildlife', 'fire', 'flood', 'medical', 'security', 'maintenance', 'other'],
      default: 'other',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'expired'],
      default: 'active',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    campground: {
      type: Schema.Types.ObjectId,
      ref: 'Campground',
      required: function () {
        return !this.campsite; // Required if no campsite is specified
      },
    },
    campsite: {
      type: Schema.Types.ObjectId,
      ref: 'Campsite',
      required: function () {
        return !this.campground; // Required if no campground is specified
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    requiresAcknowledgement: {
      type: Boolean,
      default: false,
    },
    acknowledgedBy: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        acknowledgedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
SafetyAlertSchema.index({ campground: 1, status: 1, startDate: -1 });
SafetyAlertSchema.index({ campsite: 1, status: 1, startDate: -1 });
SafetyAlertSchema.index({ status: 1, severity: 1 });
SafetyAlertSchema.index({ endDate: 1 }, { sparse: true });

// Virtual for checking if alert is currently active
SafetyAlertSchema.virtual('isActive').get(function () {
  const now = new Date();
  return (
    this.status === 'active' && this.startDate <= now && (!this.endDate || this.endDate >= now)
  );
});

// Method to check if alert should be visible to a specific user
SafetyAlertSchema.methods.isVisibleTo = function (user) {
  // Public alerts are visible to everyone
  if (this.isPublic) {
    return true;
  }

  // Private alerts are only visible to campground owners and admins
  if (!user) return false;

  return user.isAdmin || user.isOwner;
};

// Method to acknowledge an alert
SafetyAlertSchema.methods.acknowledge = function (userId) {
  if (!this.requiresAcknowledgement) {
    return false;
  }

  // Check if user has already acknowledged
  const alreadyAcknowledged = this.acknowledgedBy.some(
    (ack) => ack.user.toString() === userId.toString()
  );

  if (!alreadyAcknowledged) {
    this.acknowledgedBy.push({
      user: userId,
      acknowledgedAt: new Date(),
    });
    return true;
  }

  return false;
};

// Static method to get active alerts for a campground or campsite
SafetyAlertSchema.statics.getActiveAlerts = function (
  entityId,
  user = null,
  entityType = 'campground'
) {
  const query = {
    status: 'active',
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  };

  // Set the appropriate entity field
  if (entityType === 'campsite') {
    // For campsites, we need to get both campsite-specific alerts and campground-level alerts
    // First, we need to get the campground ID for this campsite
    const Campsite = mongoose.model('Campsite');

    return Campsite.findById(entityId).then((campsite) => {
      if (!campsite) {
        return [];
      }

      const campgroundId = campsite.campground;

      // Query for both campsite-specific alerts and campground-level alerts
      const campsiteQuery = {
        $or: [{ campsite: entityId }, { campground: campgroundId }],
        status: 'active',
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      };

      // Filter by visibility if user is provided
      if (user) {
        if (!campsiteQuery.$and) {
          campsiteQuery.$and = [];
        }

        campsiteQuery.$and.push({
          $or: [
            { isPublic: true },
            { createdBy: user._id },
            ...(user.isAdmin ? [{ isPublic: false }] : []),
          ],
        });
      }

      return this.find(campsiteQuery)
        .populate('createdBy', 'username')
        .populate('updatedBy', 'username')
        .populate('campground', 'title')
        .populate('campsite', 'name')
        .populate('acknowledgedBy.user', 'username')
        .sort({ severity: -1, startDate: -1 })
        .then((alerts) => {
          return alerts;
        });
    });
  } else {
    // For campgrounds, use the original logic
    query.campground = entityId;

    // Filter by visibility if user is provided
    if (user) {
      // Initialize $and array if it doesn't exist
      if (!query.$and) {
        query.$and = [];
      }

      query.$and.push({
        $or: [
          { isPublic: true },
          { createdBy: user._id },
          ...(user.isAdmin ? [{ isPublic: false }] : []),
        ],
      });
    }

    return this.find(query)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .populate('campground', 'title')
      .populate('campsite', 'name')
      .populate('acknowledgedBy.user', 'username')
      .sort({ severity: -1, startDate: -1 });
  }
};

// Static method to get all alerts that require acknowledgment for a campground or campsite
SafetyAlertSchema.statics.getAlertsRequiringAcknowledgement = function (
  entityId,
  user = null,
  entityType = 'campground'
) {
  const query = {
    requiresAcknowledgement: true,
  };

  // Set the appropriate entity field
  if (entityType === 'campsite') {
    // For campsites, we need to get both campsite-specific alerts and campground-level alerts
    // First, we need to get the campground ID for this campsite
    const Campsite = mongoose.model('Campsite');

    return Campsite.findById(entityId).then((campsite) => {
      if (!campsite) {
        return [];
      }

      const campgroundId = campsite.campground;

      // Query for both campsite-specific alerts and campground-level alerts
      const campsiteQuery = {
        $or: [{ campsite: entityId }, { campground: campgroundId }],
        requiresAcknowledgement: true,
      };

      // Filter by visibility if user is provided
      if (user) {
        if (!campsiteQuery.$and) {
          campsiteQuery.$and = [];
        }

        campsiteQuery.$and.push({
          $or: [
            { isPublic: true },
            { createdBy: user._id },
            ...(user.isAdmin ? [{ isPublic: false }] : []),
          ],
        });
      }

      return this.find(campsiteQuery)
        .populate('createdBy', 'username')
        .populate('updatedBy', 'username')
        .populate('campground', 'title')
        .populate('campsite', 'name')
        .populate('acknowledgedBy.user', 'username')
        .sort({ severity: -1, startDate: -1 })
        .then((alerts) => {
          return alerts;
        });
    });
  } else {
    // For campgrounds, use the original logic
    query.campground = entityId;

    // Filter by visibility if user is provided
    if (user) {
      // Initialize $and array if it doesn't exist
      if (!query.$and) {
        query.$and = [];
      }

      query.$and.push({
        $or: [
          { isPublic: true },
          { createdBy: user._id },
          ...(user.isAdmin ? [{ isPublic: false }] : []),
        ],
      });
    }

    return this.find(query)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .populate('campground', 'title')
      .populate('campsite', 'name')
      .populate('acknowledgedBy.user', 'username')
      .sort({ severity: -1, startDate: -1 });
  }
};

module.exports = mongoose.model('SafetyAlert', SafetyAlertSchema);
