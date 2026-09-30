const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema(
  {
    bloodGroup: { type: String, required: true },
    units: { type: Number, required: true },
    sourceBank: { type: String, required: true },
    destinationHospital: { type: String, required: true },
    distanceKm: { type: Number },
    reason: { type: String },
    urgency: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'HIGH',
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TransferRequest', transferSchema);