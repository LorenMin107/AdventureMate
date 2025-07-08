const mongoose = require('mongoose');
const { Schema } = mongoose;

const ActivitySchema = new Schema({
  time: { type: String }, // e.g., '09:00', 'afternoon'
  title: { type: String, required: true },
  description: { type: String },
  location: { type: String },
  campground: { type: Schema.Types.ObjectId, ref: 'Campground' },
  campsite: { type: Schema.Types.ObjectId, ref: 'Campsite' },
});

const TripDaySchema = new Schema(
  {
    trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
    date: { type: Date, required: true },
    activities: [ActivitySchema],
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TripDay', TripDaySchema);
