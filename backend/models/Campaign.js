const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    // ✅ Support multiple blood groups
    targetBloodGroups: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one blood group is required.',
      },
    },
    preferredDate: { type: Date, required: true },
    // ✅ Venue as object: { type, name, address, latitude, longitude }
    venue: {
      type: {
        type: String,
        enum: ['HOSPITAL', 'EXTERNAL'],
        default: 'HOSPITAL',
      },
      name: { type: String, required: true },       // display label
      address: { type: String },                    // optional full address
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    // Optional link to a specific hospital (for HOSPITAL type)
    hospitalName: { type: String },
    suggestedByAI: { type: Boolean, default: false },
    reason: { type: String },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED'],
      default: 'PUBLISHED',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campaign', campaignSchema);