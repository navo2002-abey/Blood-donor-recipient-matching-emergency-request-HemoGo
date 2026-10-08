const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rewardId: {
      type: Number,
      required: true,
    },
    rewardName: {
      type: String,
      required: true,
    },
    cost: {
      type: Number,
      required: true,
    },
    redeemedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

module.exports = mongoose.model('Redemption', redemptionSchema);
