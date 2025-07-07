const mongoose = require('mongoose');
const Review = require('./review');
const Booking = require('./booking');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
  url: String,
  filename: String,
});

ImageSchema.virtual('thumbnail').get(function () {
  return this.url ? this.url.replace('/upload', '/upload/w_200') : '';
});

const opts = { toJSON: { virtuals: true }, timestamps: true }; // to include virtuals when calling toJSON on the model

const CampgroundSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    images: [ImageSchema],
    geometry: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    description: String,
    location: String,
    // The author field is kept for backward compatibility
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    // New owner field to explicitly represent campground ownership
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    // Campground no longer has a price field - prices are defined at the campsite level
    // Array of campsites within this campground
    campsites: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Campsite',
      },
    ],
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
      },
    ],
  },
  opts
);

CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
  if (!this._id || !this.title) return '';
  const description = this.description || '';
  return `<strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
  <p>${description.substring(0, 20)}${description.length > 20 ? '...' : ''}</p>`;
});

// Indexes for better performance
CampgroundSchema.index({ owner: 1 });
CampgroundSchema.index({ author: 1 });
CampgroundSchema.index({ location: 'text' });
CampgroundSchema.index({ 'geometry.coordinates': '2dsphere' });

CampgroundSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await Review.deleteMany({
      _id: { $in: doc.reviews },
    });
    await Booking.deleteMany({
      campground: doc._id,
    });
  }
});

module.exports = mongoose.model('Campground', CampgroundSchema);
