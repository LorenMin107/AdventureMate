const mongoose = require('mongoose');
const { Schema } = mongoose;

const InviteSchema = new Schema(
  {
    email: { type: String, required: true },
    trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
    inviter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
    token: { type: String, required: true }, // for secure signup/acceptance
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invite', InviteSchema);
