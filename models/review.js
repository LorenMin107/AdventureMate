const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
  {
    body: {
      type: String,
      required: [true, 'Review body is required'],
      trim: true,
      minlength: [1, 'Review body cannot be empty'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review author is required'],
    },
    campground: {
      type: Schema.Types.ObjectId,
      ref: 'Campground',
      required: [true, 'Review campground is required'],
    },
  },
  { timestamps: true }
);

// Pre-save middleware to validate references
reviewSchema.pre('save', async function (next) {
  try {
    // Validate that author exists
    if (this.author) {
      const User = require('./user');
      const author = await User.findById(this.author);
      if (!author) {
        return next(new Error('Review author does not exist'));
      }
    }

    // Validate that campground exists
    if (this.campground) {
      const Campground = require('./campground');
      const campground = await Campground.findById(this.campground);
      if (!campground) {
        return next(new Error('Review campground does not exist'));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Review', reviewSchema); // create the model from the schema
