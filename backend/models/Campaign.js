const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    targetBloodGroup: { type: String, required: true },
    preferredDate: { type: Date, required: true },
    venue: { type: String, required: true },
    suggestedByAI: { type: Boolean, default: false },
    reason: { type: String },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED'],
      default: 'PUBLISHED',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campaign', campaignSchema);