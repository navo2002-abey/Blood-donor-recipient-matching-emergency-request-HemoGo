const mongoose = require('mongoose');

const ROLES = ['DONOR', 'PATIENT_FAMILY', 'BLOOD_BANK_OFFICER', 'ADMIN'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'DONOR',
    },
    // ✅ NEW: which hospital this officer belongs to
    hospital: {
      type: String,
      default: null,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      default: 'O+',
    },
    area: {
      type: String,
      trim: true,
      default: 'Colombo',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'apple'],
      default: 'local',
    },
    appleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    lastDonationDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    hospital: this.hospital,
    bloodGroup: this.bloodGroup,
    area: this.area,
    isAvailable: this.isAvailable !== false,
    avatar: this.avatar,
    isActive: this.isActive !== false,
    points: this.points || 0,
    lastDonationDate: this.lastDonationDate,
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;