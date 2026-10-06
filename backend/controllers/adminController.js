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

const getAdminBloodRequests = async (req, res) => {
  try {
    const filter = {};
    const { status, urgency, bloodGroup, hospital, search, page = 1, limit = 10 } = req.query;

    if (status && status !== 'All') {
      const upper = String(status).toUpperCase();
      if (upper === 'IN_PROGRESS') {
        filter.status = { $in: ['IN_PROGRESS', 'ACCEPTED', 'ARRIVED', 'MATCHED'] };
      } else if (upper === 'FULFILLED') {
        filter.status = { $in: ['FULFILLED', 'VERIFIED', 'COMPLETED'] };
      } else {
        filter.status = upper;
      }
    }
    if (urgency && urgency !== 'All') {
      filter.urgency = { $regex: new RegExp(`^${escapeRegex(urgency)}$`, 'i') };
    }
    if (bloodGroup && bloodGroup !== 'All') {
      filter.bloodGroup = bloodGroup;
    }
    if (hospital && hospital !== 'All') {
      filter.hospital = { $regex: escapeRegex(hospital), $options: 'i' };
    }
    if (search && search.trim()) {
      const term = escapeRegex(search.trim());
      filter.$or = [
        { patientName: { $regex: term, $options: 'i' } },
        { hospital: { $regex: term, $options: 'i' } },
        { bloodGroup: { $regex: term, $options: 'i' } },
        { verifierId: { $regex: term, $options: 'i' } },
      ];
      if (mongoose.Types.ObjectId.isValid(search.trim())) {
        filter.$or.push({ _id: search.trim() });
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const pageLimit = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * pageLimit;

    const [total, openCount, inProgressCount, fulfilledCount, cancelledCount, criticalCount] = await Promise.all([
      BloodRequest.countDocuments(filter),
      BloodRequest.countDocuments({ status: 'OPEN' }),
      BloodRequest.countDocuments({ status: { $in: ['IN_PROGRESS', 'ACCEPTED'] } }),
      BloodRequest.countDocuments({ status: { $in: ['FULFILLED', 'VERIFIED', 'COMPLETED'] } }),
      BloodRequest.countDocuments({ status: 'CANCELLED' }),
      BloodRequest.countDocuments({ urgency: 'Critical', status: { $nin: ['FULFILLED', 'VERIFIED', 'COMPLETED', 'CANCELLED'] } }),
    ]);

    const requests = await BloodRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .populate('requestedBy', 'name email phone role')
      .populate('acceptedBy', 'name email phone role')
      .populate('verifiedBy', 'name email phone role')
      .populate('acceptedDonors.donor', 'name email phone role');

    const totalPages = Math.max(1, Math.ceil(total / pageLimit));

    return res.status(200).json({
      success: true,
      data: requests,
      count: requests.length,
      total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages,
      metrics: {
        total,
        open: openCount,
        inProgress: inProgressCount,
        fulfilled: fulfilledCount,
        cancelled: cancelledCount,
        critical: criticalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching admin blood requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve blood requests for admin.',
    });
  }
};

const updateAdminBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patientName,
      hospital,
      bloodGroup,
      units,
      fulfilledUnits,
      requiredDateTime,
      urgency,
      additionalInfo,
      status,
    } = req.body;

    const request = await BloodRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found.',
      });
    }

    if (patientName !== undefined) request.patientName = patientName;
    if (hospital !== undefined) request.hospital = hospital;
    if (bloodGroup !== undefined) request.bloodGroup = bloodGroup;
    if (units !== undefined) request.units = Number(units);
    if (fulfilledUnits !== undefined) request.fulfilledUnits = Number(fulfilledUnits);
    if (requiredDateTime !== undefined) request.requiredDateTime = requiredDateTime;
    if (urgency !== undefined) request.urgency = urgency;
    if (additionalInfo !== undefined) request.additionalInfo = additionalInfo;
    if (status !== undefined) request.status = status;

    const updated = await request.save();

    return res.status(200).json({
      success: true,
      message: 'Blood request updated successfully by admin.',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating admin blood request:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update blood request.',
    });
  }
};

const assignDonorToBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { donorId } = req.body;

    if (!donorId) {
      return res.status(400).json({
        success: false,
        message: 'Donor ID is required.',
      });
    }

    const [request, donorUser] = await Promise.all([
      BloodRequest.findById(id),
      User.findById(donorId),
    ]);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found.',
      });
    }
    if (!donorUser) {
      return res.status(404).json({
        success: false,
        message: 'Donor user not found.',
      });
    }

    if (!Array.isArray(request.acceptedDonors)) {
      request.acceptedDonors = [];
    }

    const alreadyAssigned = request.acceptedDonors.some(
      (d) => d.donor && String(d.donor) === String(donorId) && d.status === 'ACCEPTED'
    );

    if (!alreadyAssigned) {
      request.acceptedDonors.push({
        donor: donorUser._id,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      });
    }

    request.acceptedBy = donorUser._id;
    request.acceptedAt = new Date();
    request.status = 'IN_PROGRESS';

    const saved = await request.save();

    return res.status(200).json({
      success: true,
      message: `Successfully assigned donor ${donorUser.name} to this request.`,
      data: saved,
    });
  } catch (error) {
    console.error('Error assigning donor to request:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign donor.',
    });
  }
};

const overrideBloodRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required.',
      });
    }

    const request = await BloodRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found.',
      });
    }

    request.status = status;
    if (status === 'VERIFIED' || status === 'FULFILLED') {
      request.fulfilledUnits = request.units || 1;
      request.verifiedAt = new Date();
      if (!request.verifierId) request.verifierId = '#ADMIN_VERIFIED';
    } else if (status === 'OPEN') {
      request.fulfilledUnits = 0;
      request.acceptedBy = null;
      request.acceptedAt = null;
    }

    if (adminNotes) {
      request.additionalInfo = `${request.additionalInfo ? request.additionalInfo + ' | ' : ''}[Admin Note: ${adminNotes}]`;
    }

    const saved = await request.save();

    return res.status(200).json({
      success: true,
      message: `Status updated to ${status} successfully.`,
      data: saved,
    });
  } catch (error) {
    console.error('Error overriding status:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to override status.',
    });
  }
};

const deleteAdminBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await BloodRequest.findByIdAndDelete(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Blood request permanently deleted by admin.',
    });
  } catch (error) {
    console.error('Error deleting request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete blood request.',
    });
  }
};

module.exports = {
  getStats,
  getUsers,
  createUser,
  updateUser,
  getReports,
  getAdminBloodRequests,
  updateAdminBloodRequest,
  assignDonorToBloodRequest,
  overrideBloodRequestStatus,
  deleteAdminBloodRequest,
};
