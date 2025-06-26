const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BookingSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  campground: {
    type: Schema.Types.ObjectId,
    ref: "Campground",
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  sessionId: {
    type: String,
    unique: true, // Ensure sessionId is unique
    sparse: true  // Allow null/undefined values (for bookings without sessionId)
  },
  paid: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model("Booking", BookingSchema);
