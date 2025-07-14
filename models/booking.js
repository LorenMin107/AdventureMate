const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Keep campground reference for backward compatibility and for easier querying
    campground: {
      type: Schema.Types.ObjectId,
      ref: 'Campground',
      required: true,
    },
    // Add reference to specific campsite
    campsite: {
      type: Schema.Types.ObjectId,
      ref: 'Campsite',
      // Not required for backward compatibility
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    // Number of people for this booking
    guests: {
      type: Number,
      default: 1,
    },
    sessionId: {
      type: String,
      unique: true, // Ensure sessionId is unique
      sparse: true, // Allow null/undefined values (for bookings without sessionId)
    },
    paid: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', BookingSchema);
