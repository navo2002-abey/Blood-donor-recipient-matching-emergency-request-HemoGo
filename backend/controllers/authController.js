const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const PUBLIC_ROLES = ['DONOR', 'PATIENT_FAMILY'];

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Try logging in instead.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userRole = PUBLIC_ROLES.includes(role) ? role : 'DONOR';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      role: userRole,
    });

    const token = createToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Try logging in instead.',
      });
    }

    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to create your account right now. Please try again.',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email and password.',
      });
    }

    const identifier = email.trim();
    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { phone: identifier };

    const user = await User.findOne(query).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Check your email or phone and try again.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Contact an administrator.',
      });
    }

    const token = createToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to log in right now. Please try again.',
    });
  }
};

const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user.toPublicJSON(),
  });
};

const updateProfile = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in your name, email, and phone number.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    const taken = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (taken) {
      return res.status(409).json({
        success: false,
        message: 'This email is already used by another account.',
      });
    }

    req.user.name = name;
    req.user.email = email;
    req.user.phone = phone;
    await req.user.save();

    return res.status(200).json({
      success: true,
      user: req.user.toPublicJSON(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This email is already used by another account.',
      });
    }

    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to update your profile right now.',
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Enter your current password and a new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Please log in again.',
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password updated.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to change your password right now.',
    });
  }
};

const phoneKey = (value) => String(value || '').replace(/\D/g, '').slice(-9);

const forgotPassword = async (req, res) => {
  try {
    const { email, phone, newPassword } = req.body;

    if (!email || !phone || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email, phone number, and a new password.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    const phoneMatches = user && phoneKey(user.phone).length >= 9 && phoneKey(user.phone) === phoneKey(phone);

    if (!phoneMatches) {
      return res.status(400).json({
        success: false,
        message: 'Those details do not match an account.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Contact an administrator.',
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password updated. You can log in with your new password.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to reset your password right now.',
    });
  }
};

const socialLogin = async (req, res) => {
  try {
    const { provider, name, email, phone, appleId } = req.body;
    const allowed = ['google', 'apple'];

    if (!allowed.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Choose Google or Apple to continue.',
      });
    }

    const normalizedEmail = email ? String(email).toLowerCase().trim() : '';
    const normalizedAppleId = appleId ? String(appleId).trim() : '';

    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    let user = null;
    if (provider === 'apple' && normalizedAppleId) {
      user = await User.findOne({ appleId: normalizedAppleId });
    }
    if (!user && normalizedEmail) {
      user = await User.findOne({ email: normalizedEmail });
    }

    const enteredPhone = phone ? String(phone).trim() : '';
    const enteredPhoneKey = phoneKey(enteredPhone);
    if (!user && enteredPhoneKey.length >= 9) {
      user = await User.findOne({ phone: { $regex: `${enteredPhoneKey}$` } });
    }

    if (!user && !normalizedEmail) {
      return res.status(200).json({
        success: true,
        needsProfile: true,
        phone: enteredPhone || undefined,
      });
    }

    if (user) {
      if (phone && phoneKey(user.phone) !== phoneKey(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Those details do not match an account.',
        });
      }

      if (user.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'This account has been deactivated. Contact an administrator.',
        });
      }

      if (normalizedAppleId && user.appleId !== normalizedAppleId) {
        user.appleId = normalizedAppleId;
        user.authProvider = 'apple';
        await user.save();
      }
    } else if (!name || !phone || phoneKey(phone).length < 9) {
      return res.status(200).json({
        success: true,
        needsProfile: true,
        email: normalizedEmail,
      });
    } else {
      const randomPassword = crypto.randomBytes(24).toString('hex');
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        password: await bcrypt.hash(randomPassword, 12),
        role: 'DONOR',
        authProvider: provider,
        appleId: provider === 'apple' ? normalizedAppleId || undefined : undefined,
      });
    }

    const token = createToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Try logging in instead.',
      });
    }

    console.error('Social login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to continue right now. Please try again.',
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  socialLogin,
};
