const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    unitId: { type: String, required: true },
    stockId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodStock' },
    bloodGroup: { type: String, required: true },
    units: { type: Number, default: 1, min: 1 },
    patientName: { type: String, required: true },
    ward: { type: String, required: true },
    hospital: { type: String, required: true },
    reservedFor: { type: String },
    reservedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    status: {
      type: String,
      enum: ['RESERVED', 'RELEASED', 'USED', 'EXPIRED'],
      default: 'RESERVED',
    },
    reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // ✅ NEW — links this reservation to a transfer
    transferId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransferRequest' },
    isTransfer: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reservation', reservationSchema);