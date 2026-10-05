const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const BloodBank = require('../models/BloodBank');
const BloodRequest = require('../models/BloodRequest');
const BloodStock = require('../models/BloodStock');
const Campaign = require('../models/Campaign');
const TransferRequest = require('../models/TransferRequest');
const User = require('../models/User');
const { ROLES } = User;

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getStats = async (req, res) => {
  try {
    const [total, donors, officers, patients, admins] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'DONOR' }),
      User.countDocuments({ role: 'BLOOD_BANK_OFFICER' }),
      User.countDocuments({ role: 'PATIENT_FAMILY' }),
      User.countDocuments({ role: 'ADMIN' }),
    ]);

    return res.status(200).json({
      success: true,
      stats: { total, donors, officers, patients, admins },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load admin stats right now.',
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const filter = {};
    const role = String(req.query.role || '').trim();
    const query = String(req.query.q || '').trim();

    if (role) {
      if (!ROLES.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'That role is not valid.',
        });
      }
      filter.role = role;
    }

    if (query) {
      const term = escapeRegex(query.slice(0, 80));
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } },
        { hospital: { $regex: term, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      users: users.map((user) => ({
        ...user.toPublicJSON(),
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load users right now.',
    });
  }
};

const updateUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'That user could not be found.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'That user could not be found.',
      });
    }

    const { role, hospital, isActive } = req.body;
    const nextRole = role ? String(role).trim() : user.role;

    if (!ROLES.includes(nextRole)) {
      return res.status(400).json({
        success: false,
        message: 'That role is not valid.',
      });
    }

    if (String(user._id) === String(req.user._id) && nextRole !== user.role) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role.',
      });
    }

    if (user.role === 'ADMIN' && nextRole !== 'ADMIN') {
      const adminCount = await User.countDocuments({ role: 'ADMIN' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'At least one admin account is required.',
        });
      }
    }

    if (typeof isActive === 'boolean' && isActive !== (user.isActive !== false)) {
      if (String(user._id) === String(req.user._id) && !isActive) {
        return res.status(400).json({
          success: false,
          message: 'You cannot deactivate your own account.',
        });
      }

      if (user.role === 'ADMIN' && !isActive) {
        const activeAdmins = await User.countDocuments({
          role: 'ADMIN',
          isActive: { $ne: false },
        });
        if (activeAdmins <= 1) {
          return res.status(400).json({
            success: false,
            message: 'At least one active admin account is required.',
          });
        }
      }

      user.isActive = isActive;
    }

    user.role = nextRole;
    if (hospital !== undefined) {
      const trimmed = String(hospital || '').trim();
      user.hospital = trimmed || null;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to update this user right now.',
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, hospital } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.',
      });
    }

    if (!isValidEmail(String(email).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const userRole = String(role || '').trim();
    if (!ROLES.includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: 'That role is not valid.',
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered.',
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 12);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      password: hashedPassword,
      role: userRole,
      hospital: hospital ? String(hospital).trim() : null,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered.',
      });
    }

    console.error('Admin create user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to create this user right now.',
    });
  }
};

const countMap = (rows) =>
  rows.reduce((acc, row) => {
    if (row._id) acc[row._id] = row.count;
    return acc;
  }, {});

const getReports = async (req, res) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const now = new Date();

    const [
      usersByRole,
      activeUsers,
      inactiveUsers,
      requestsByStatus,
      requestsByUrgency,
      requestsByGroup,
      unitTotals,
      recentRequests,
      weekRequests,
      stockByGroup,
      transfersByStatus,
      campaignsByStatus,
      bloodBanks,
    ] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      User.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ isActive: false }),
      BloodRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      BloodRequest.aggregate([{ $group: { _id: '$urgency', count: { $sum: 1 } } }]),
      BloodRequest.aggregate([
        { $group: { _id: '$bloodGroup', requests: { $sum: 1 }, units: { $sum: '$units' } } },
      ]),
      BloodRequest.aggregate([
        {
          $group: {
            _id: null,
            requested: { $sum: '$units' },
            fulfilled: { $sum: '$fulfilledUnits' },
          },
        },
      ]),
      BloodRequest.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('patientName hospital bloodGroup units urgency status createdAt'),
      BloodRequest.countDocuments({ createdAt: { $gte: weekAgo } }),
      BloodStock.aggregate([
        { $match: { status: 'AVAILABLE', expiryDate: { $gte: now } } },
        { $group: { _id: '$bloodGroup', units: { $sum: '$units' } } },
      ]),
      TransferRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Campaign.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      BloodBank.countDocuments(),
    ]);

    const demand = Object.fromEntries(
      requestsByGroup.map((row) => [row._id, { requests: row.requests, units: row.units }])
    );
    const stock = Object.fromEntries(stockByGroup.map((row) => [row._id, row.units]));
    const requestedUnits = unitTotals[0]?.requested || 0;
    const fulfilledUnits = unitTotals[0]?.fulfilled || 0;

    return res.status(200).json({
      success: true,
      report: {
        generatedAt: now,
        users: {
          active: activeUsers,
          inactive: inactiveUsers,
          byRole: countMap(usersByRole),
        },
        requests: {
          total: requestsByStatus.reduce((sum, row) => sum + row.count, 0),
          thisWeek: weekRequests,
          byStatus: countMap(requestsByStatus),
          byUrgency: countMap(requestsByUrgency),
          unitsRequested: requestedUnits,
          unitsFulfilled: fulfilledUnits,
          recent: recentRequests.map((item) => ({
            id: item._id.toString(),
            patientName: item.patientName,
            hospital: item.hospital,
            bloodGroup: item.bloodGroup,
            units: item.units,
            urgency: item.urgency,
            status: item.status,
            createdAt: item.createdAt,
          })),
        },
        bloodGroups: BLOOD_GROUPS.map((group) => ({
          group,
          requests: demand[group]?.requests || 0,
          unitsRequested: demand[group]?.units || 0,
          unitsAvailable: stock[group] || 0,
        })),
        transfers: countMap(transfersByStatus),
        campaigns: countMap(campaignsByStatus),
        bloodBanks,
      },
    });
  } catch (error) {
    console.error('Admin reports error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load reports right now.',
    });
  }
};

module.exports = { getStats, getUsers, createUser, updateUser, getReports };
