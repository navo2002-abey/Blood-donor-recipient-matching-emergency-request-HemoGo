const mongoose = require('mongoose');

const emergencyAlertSchema = new mongoose.Schema(
  {
    targetEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    targetUserId: {
      type: String,
      default: null,
    },
    targetName: {
      type: String,
      default: 'Donor',
    },
    targetPhone: {
      type: String,
      default: '',
    },
    targetAll: {
      type: Boolean,
      default: false,
    },
    targetDonors: {
      type: Array,
      default: [],
    },
    senderEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    senderName: {
      type: String,
      default: 'Requester',
    },
    senderId: {
      type: String,
      default: null,
    },
    bloodGroup: {
      type: String,
      required: true,
      default: 'O+',
    },
    hospital: {
      type: String,
      required: true,
      default: 'National Hospital Colombo',
    },
    patientName: {
      type: String,
      default: 'Patient',
    },
    phone: {
      type: String,
      default: '071-2345678',
    },
    requestId: {
      type: String,
      default: 'REQ-2026-001',
    },
    requestData: {
      type: Object,
      default: {},
    },
    location: {
      type: Object,
      default: { latitude: 6.9271, longitude: 79.8612 },
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DISMISSED'],
      default: 'PENDING',
    },
    dismissedBy: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);
