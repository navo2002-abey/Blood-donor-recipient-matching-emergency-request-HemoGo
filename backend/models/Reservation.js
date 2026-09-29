const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    unitId: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    patientName: { type: String, required: true },
    ward: { type: String, required: true },
    hospital: { type: String, required: true },
    reservedFor: { type: String }, // surgery / ward / patient
    reservedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    status: {
      type: String,
      enum: ['RESERVED', 'RELEASED', 'USED', 'EXPIRED'],
      default: 'RESERVED',
    },
    reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reservation', reservationSchema);