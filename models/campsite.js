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
  // Track booked dates to prevent double bookings
  bookedDates: [{
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking"
    }
  }]
});

// Virtual property for thumbnail images
CampsiteSchema.virtual("thumbnail").get(function () {
  return this.images && this.images.length > 0 && this.images[0].url 
    ? this.images[0].url.replace("/upload", "/upload/w_200") 
    : '';
});

// Ensure virtuals are included when converting to JSON
CampsiteSchema.set('toJSON', { virtuals: true });

// Method to check if a campsite is available for specific dates
CampsiteSchema.methods.isAvailableForDates = function(startDate, endDate) {
  // If the campsite is not available at all, return false
  if (!this.availability) {
    return false;
  }

  // Convert string dates to Date objects if needed
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  // Check if the requested dates overlap with any booked dates
  for (const bookedDate of this.bookedDates) {
    const bookedStart = new Date(bookedDate.startDate);
    const bookedEnd = new Date(bookedDate.endDate);

    // Check for overlap
    if (
      (start <= bookedEnd && end >= bookedStart) // Requested dates overlap with booked dates
    ) {
      return false; // Dates are not available
    }
  }

  return true; // Dates are available
};

module.exports = mongoose.model("Campsite", CampsiteSchema);
