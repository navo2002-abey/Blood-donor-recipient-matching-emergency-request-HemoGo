const mongoose = require('mongoose');

const bestDonorAISchema = new mongoose.Schema(
  {
    requestMatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RequestMatch',
      required: true,
    },
    rank: {
      type: Number,
      required: true,
    },
    donorId: {
      type: String,
      trim: true,
      default: '',
    },
    donorName: {
      type: String,
      required: true,
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: true,
      trim: true,
    },
    distanceKm: {
      type: Number,
      default: 0,
    },
    hospital: {
      type: String,
      trim: true,
      default: '',
    },
    available: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      required: true,
    },
    exact: {
      type: Boolean,
      default: false,
    },
    matchedHospital: {
      type: Boolean,
      default: false,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'bestdonorAI',
  }
);

module.exports = mongoose.model('BestDonorAI', bestDonorAISchema);
