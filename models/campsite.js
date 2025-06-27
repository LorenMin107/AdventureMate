const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CampsiteSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  features: [String],
  price: {
    type: Number,
    required: true
  },
  capacity: {
    type: Number,
    default: 1
  },
  images: [{
    url: String,
    filename: String
  }],
  campground: {
    type: Schema.Types.ObjectId,
    ref: "Campground",
    required: true
  },
  bookings: [{
    type: Schema.Types.ObjectId,
    ref: "Booking"
  }],
  availability: {
    type: Boolean,
    default: true
  },
  // We can add more specific availability logic later if needed
  // For example, a calendar of available dates
});

// Virtual property for thumbnail images
CampsiteSchema.virtual("thumbnail").get(function () {
  return this.images && this.images.length > 0 && this.images[0].url 
    ? this.images[0].url.replace("/upload", "/upload/w_200") 
    : '';
});

// Ensure virtuals are included when converting to JSON
CampsiteSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("Campsite", CampsiteSchema);
