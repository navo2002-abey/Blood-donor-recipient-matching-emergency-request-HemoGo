const mongoose = require('mongoose');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const requestSummarySchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
    },
    bloodType: {
      type: String,
      required: [true, 'Blood type is required'],
      enum: BLOOD_GROUPS,
    },
    unitsRequired: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    additionalDetails: {
      type: String,
      trim: true,
      default: '',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    donorId: {
      type: String,
      trim: true,
      default: '',
    },
    donorName: {
      type: String,
      required: [true, 'Donor name is required'],
      trim: true,
    },
    donorPhone: {
      type: String,
      trim: true,
      default: '',
    },
    donorHospital: {
      type: String,
      trim: true,
      default: '',
    },
    donorArea: {
      type: String,
      trim: true,
      default: '',
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    requesterName: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'requestsummary',
  }
);

module.exports = mongoose.model('RequestSummary', requestSummarySchema);
