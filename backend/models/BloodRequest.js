const mongoose = require('mongoose');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'ACCEPTED', 'ARRIVED', 'VERIFIED', 'MATCHED', 'FULFILLED', 'CANCELLED'];

const bloodRequestSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    hospital: {
      type: String,
      required: [true, 'Hospital is required'],
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: {
        values: BLOOD_GROUPS,
        message: '{VALUE} is not a valid blood group',
      },
    },
    units: {
      type: Number,
      required: [true, 'Units quantity is required'],
      min: [1, 'Quantity must be at least 1 unit'],
      default: 1,
    },
    fulfilledUnits: {
      type: Number,
      default: 0,
      min: 0,
    },
    requiredDateTime: {
      type: String,
      required: [true, 'Required date and time is required'],
      trim: true,
    },
    urgency: {
      type: String,
      enum: URGENCIES,
      default: 'Medium',
    },
    additionalInfo: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'OPEN',
    },
    verifierId: {
      type: String,
      trim: true,
      default: null,
    },
    verificationCode: {
      type: String,
      trim: true,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acceptedDonors: [
      {
        donor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['ACCEPTED', 'VERIFIED', 'CANCELLED'],
          default: 'ACCEPTED',
        },
        acceptedAt: {
          type: Date,
          default: Date.now,
        },
        verifiedAt: {
          type: Date,
          default: null,
        },
        verifierId: {
          type: String,
          default: null,
        },
      },
    ],
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate realistic Verifier ID if not set
bloodRequestSchema.pre('save', function (next) {
  if (!this.verifierId && this.hospital) {
    const words = this.hospital.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
    let prefix = '';
    if (words.length >= 3) {
      prefix = (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
    } else if (words.length === 2) {
      prefix = (words[0][0] + words[1].slice(0, 2)).toUpperCase();
    } else if (words[0]) {
      prefix = words[0].slice(0, 3).toUpperCase();
    } else {
      prefix = 'NHC';
    }
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    this.verifierId = `#${prefix}${randomNum}`;
  } else if (!this.verifierId) {
    this.verifierId = '#NHC01078';
  }

  if (!this.verificationCode) {
    this.verificationCode = 'VER-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
module.exports.BLOOD_GROUPS = BLOOD_GROUPS;
module.exports.URGENCIES = URGENCIES;
module.exports.STATUSES = STATUSES;
