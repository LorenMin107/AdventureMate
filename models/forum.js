const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'general',
        'camping-tips',
        'equipment',
        'destinations',
        'safety',
        'reviews',
        'questions',
        'announcements',
      ],
      default: 'general',
    },
    type: {
      type: String,
      required: true,
      enum: ['discussion', 'question'],
      default: 'discussion',
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [20, 'Tag cannot exceed 20 characters'],
      },
    ],
    isSticky: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    replies: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        content: {
          type: String,
          required: true,
          trim: true,
          maxlength: [2000, 'Reply content cannot exceed 2000 characters'],
        },
        isAccepted: {
          type: Boolean,
          default: false,
        },
        upvotes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
        downvotes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'closed', 'deleted'],
      default: 'active',
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for vote count
forumSchema.virtual('voteCount').get(function () {
  const upvotesLength = this.upvotes && Array.isArray(this.upvotes) ? this.upvotes.length : 0;
  const downvotesLength =
    this.downvotes && Array.isArray(this.downvotes) ? this.downvotes.length : 0;
  return upvotesLength - downvotesLength;
});

// Virtual for reply count
forumSchema.virtual('replyCount').get(function () {
  return this.replies && Array.isArray(this.replies) ? this.replies.length : 0;
});

// Virtual for total views
forumSchema.virtual('totalViews').get(function () {
  return this.views || 0;
});

// Indexes for better performance
forumSchema.index({ category: 1, createdAt: -1 });
forumSchema.index({ author: 1, createdAt: -1 });
forumSchema.index({ type: 1, createdAt: -1 });
forumSchema.index({ isSticky: 1, isPinned: 1, createdAt: -1 });
forumSchema.index({ tags: 1 });
forumSchema.index({ status: 1 });

// Pre-save middleware to update lastActivity
forumSchema.pre('save', function (next) {
  this.lastActivity = new Date();
  next();
});

// Pre-save middleware to update reply timestamps
forumSchema.pre('save', function (next) {
  if (this.isModified('replies') && this.replies && Array.isArray(this.replies)) {
    this.replies.forEach((reply) => {
      if (reply && reply.isModified && reply.isModified()) {
        reply.updatedAt = new Date();
      }
    });
  }
  next();
});

// Static method to get categories
forumSchema.statics.getCategories = function () {
  return [
    { value: 'general', label: 'General Discussion', icon: '💬' },
    { value: 'camping-tips', label: 'Camping Tips', icon: '🏕️' },
    { value: 'equipment', label: 'Equipment & Gear', icon: '🎒' },
    { value: 'destinations', label: 'Destinations', icon: '🗺️' },
    { value: 'safety', label: 'Safety & First Aid', icon: '🛡️' },
    { value: 'reviews', label: 'Reviews & Recommendations', icon: '⭐' },
    { value: 'questions', label: 'Q&A', icon: '❓' },
    { value: 'announcements', label: 'Announcements', icon: '📢' },
  ];
};

// Instance method to add view
forumSchema.methods.addView = function () {
  // Prevent negative views
  if (this.views < 0) {
    this.views = 0;
  }
  this.views += 1;
  return this.save();
};

// Instance method to toggle vote
forumSchema.methods.toggleVote = function (userId, voteType) {
  // Ensure arrays exist
  if (!this.upvotes) this.upvotes = [];
  if (!this.downvotes) this.downvotes = [];

  const upvoteIndex = this.upvotes.indexOf(userId);
  const downvoteIndex = this.downvotes.indexOf(userId);

  if (voteType === 'upvote') {
    if (upvoteIndex > -1) {
      // Remove upvote
      this.upvotes.splice(upvoteIndex, 1);
    } else {
      // Add upvote and remove downvote if exists
      this.upvotes.push(userId);
      if (downvoteIndex > -1) {
        this.downvotes.splice(downvoteIndex, 1);
      }
    }
  } else if (voteType === 'downvote') {
    if (downvoteIndex > -1) {
      // Remove downvote
      this.downvotes.splice(downvoteIndex, 1);
    } else {
      // Add downvote and remove upvote if exists
      this.downvotes.push(userId);
      if (upvoteIndex > -1) {
        this.upvotes.splice(upvoteIndex, 1);
      }
    }
  }

  return this.save();
};

// Instance method to add reply
forumSchema.methods.addReply = function (authorId, content) {
  // Ensure replies array exists
  if (!this.replies) this.replies = [];

  this.replies.push({
    author: authorId,
    content,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  this.lastActivity = new Date();
  return this.save();
};

// Instance method to toggle reply vote
forumSchema.methods.toggleReplyVote = function (replyIndex, userId, voteType) {
  // Ensure replies array exists
  if (!this.replies) this.replies = [];

  const reply = this.replies[replyIndex];
  if (!reply) {
    throw new Error('Reply not found');
  }

  // Ensure reply vote arrays exist
  if (!reply.upvotes) reply.upvotes = [];
  if (!reply.downvotes) reply.downvotes = [];

  const upvoteIndex = reply.upvotes.indexOf(userId);
  const downvoteIndex = reply.downvotes.indexOf(userId);

  if (voteType === 'upvote') {
    if (upvoteIndex > -1) {
      reply.upvotes.splice(upvoteIndex, 1);
    } else {
      reply.upvotes.push(userId);
      if (downvoteIndex > -1) {
        reply.downvotes.splice(downvoteIndex, 1);
      }
    }
  } else if (voteType === 'downvote') {
    if (downvoteIndex > -1) {
      reply.downvotes.splice(downvoteIndex, 1);
    } else {
      reply.downvotes.push(userId);
      if (upvoteIndex > -1) {
        reply.upvotes.splice(upvoteIndex, 1);
      }
    }
  }

  reply.updatedAt = new Date();
  this.lastActivity = new Date();
  return this.save();
};

// Instance method to accept answer (for questions)
forumSchema.methods.acceptAnswer = function (replyIndex) {
  if (this.type !== 'question') {
    throw new Error('Only questions can have accepted answers');
  }

  // Ensure replies array exists
  if (!this.replies) this.replies = [];

  // Unaccept all other replies
  this.replies.forEach((reply) => {
    reply.isAccepted = false;
  });

  // Accept the specified reply
  if (this.replies[replyIndex]) {
    this.replies[replyIndex].isAccepted = true;
  }

  return this.save();
};

// Instance method to delete reply
forumSchema.methods.deleteReply = function (replyIndex) {
  // Ensure replies array exists
  if (!this.replies) this.replies = [];

  if (replyIndex < 0 || replyIndex >= this.replies.length) {
    throw new Error('Reply not found');
  }

  // Remove the reply at the specified index
  this.replies.splice(replyIndex, 1);
  this.lastActivity = new Date();
  return this.save();
};

module.exports = mongoose.model('Forum', forumSchema);
