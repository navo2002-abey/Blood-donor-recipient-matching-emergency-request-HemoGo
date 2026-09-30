const mongoose = require('mongoose');

const bloodBankSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    contact: { type: String, required: true },
    location: {
      latitude: Number,
      longitude: Number,
    },
    operatingHours: { type: String, default: 'Open 24 Hours' },
    verified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BloodBank', bloodBankSchema);