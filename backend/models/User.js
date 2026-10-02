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
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;