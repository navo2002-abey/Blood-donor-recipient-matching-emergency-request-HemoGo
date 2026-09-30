const mongoose = require('mongoose');

const bloodStockSchema = new mongoose.Schema(
  {
    bloodGroup: {
      type: String,
      enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
      required: true,
    },
    units: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date, required: true },
    hospital: { type: String, required: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank' },
    status: {
      type: String,
      enum: ['AVAILABLE', 'RESERVED', 'USED', 'EXPIRED', 'TRANSFERRED'],
      default: 'AVAILABLE',
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BloodStock', bloodStockSchema);