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
      enum: ['PENDING', 'APPROVED', 'DELIVERED', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveredAt: Date,
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: Date,
    // ✅ NEW — records which source batches were drawn (with their expiry dates)
    // So on completion, destination stock is created with the SAME expiry dates
    sourceBatches: [
      {
        expiryDate: { type: Date, required: true },
        units: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('TransferRequest', transferSchema);