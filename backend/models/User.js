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
    availabilityStatus: {
      type: String,
      enum: ['AVAILABLE', 'TEMPORARILY_UNAVAILABLE', 'UNAVAILABLE'],
      default: 'AVAILABLE',
    },
    unavailableUntil: {
      type: Date,
      default: null,
    },
    unavailableReason: {
      type: String,
      default: '',
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

userSchema.methods.checkAndResetAvailability = async function checkAndResetAvailability() {
  if (
    this.availabilityStatus === 'TEMPORARILY_UNAVAILABLE' &&
    this.unavailableUntil &&
    new Date(this.unavailableUntil) <= new Date()
  ) {
    this.isAvailable = true;
    this.availabilityStatus = 'AVAILABLE';
    this.unavailableUntil = null;
    await this.save();
  }
  return this;
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  const isTemporarilyExpired =
    this.availabilityStatus === 'TEMPORARILY_UNAVAILABLE' &&
    this.unavailableUntil &&
    new Date(this.unavailableUntil) <= new Date();

  const effectiveStatus = isTemporarilyExpired
    ? 'AVAILABLE'
    : this.availabilityStatus || (this.isAvailable !== false ? 'AVAILABLE' : 'UNAVAILABLE');

  const effectiveIsAvailable = effectiveStatus === 'AVAILABLE';
  const effectiveUntil = isTemporarilyExpired ? null : this.unavailableUntil;

  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    hospital: this.hospital,
    bloodGroup: this.bloodGroup,
    area: this.area,
    isAvailable: effectiveIsAvailable,
    availabilityStatus: effectiveStatus,
    unavailableUntil: effectiveUntil,
    unavailableReason: this.unavailableReason || '',
    avatar: this.avatar,
    isActive: this.isActive !== false,
    points: this.points || 0,
    lastDonationDate: this.lastDonationDate,
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;