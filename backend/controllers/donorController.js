const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const QRCode = require('../models/QRCode');
const User = require('../models/User');
const Redemption = require('../models/Redemption');

const POINTS_PER_DONATION = 100;
const MIN_DAYS_BETWEEN_DONATIONS = 90;

const REWARDS = {
  1: { points: 1000, name: 'Free Health Check Up' },
  2: { points: 750, name: 'Coffee Voucher' },
  3: { points: 500, name: 'HemoGo T-Shirt' },
  4: { points: 250, name: 'HemoGo Mug' },
};

const getDonorProfile = async (req, res) => {
  try {
    let nextEligibleDate = null;
    if (req.user.lastDonationDate) {
      const lastDonation = new Date(req.user.lastDonationDate);
      const nextEligible = new Date(lastDonation);
      nextEligible.setDate(nextEligible.getDate() + MIN_DAYS_BETWEEN_DONATIONS);
      nextEligibleDate = nextEligible.toISOString().split('T')[0];
    }

    res.status(200).json({
      success: true,
      data: {
        ...req.user.toPublicJSON(),
        nextEligibleDate,
      },
    });
  } catch (error) {
    console.error('Get donor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donor profile',
    });
  }
};

const verifyQR = async (req, res) => {
  try {
    const { qrCodeId } = req.body;

    if (!qrCodeId) {
      return res.status(400).json({
        success: false,
        message: 'QR code ID is required',
      });
    }

    // Find QR code
    const qrCode = await QRCode.findOne({ code: qrCodeId });
    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found',
      });
    }

    if (qrCode.used) {
      return res.status(400).json({
        success: false,
        message: 'QR code has already been used',
      });
    }

    // Find appointment and populate user
    const appointment = await Appointment.findById(qrCode.appointmentId).populate('user');
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (appointment.completed) {
      return res.status(400).json({
        success: false,
        message: 'This appointment has already been completed',
      });
    }


    // Check eligibility (but don't block scanning - always return eligible)
    const donor = appointment.user;
    let eligible = true;
    let nextEligibleDate = null;

    // Skip eligibility check for QR scanning - always allow officers to scan
    // if (donor.lastDonationDate) {
    //   const lastDonation = new Date(donor.lastDonationDate);
    //   const nextEligible = new Date(lastDonation);
    //   nextEligible.setDate(nextEligible.getDate() + MIN_DAYS_BETWEEN_DONATIONS);
    //   const today = new Date();

    //   if (today < nextEligible) {
    //     eligible = false;
    //     nextEligibleDate = nextEligible.toISOString().split('T')[0];
    //   }
    // }

    res.status(200).json({
      success: true,
      data: {
        donor: {
          name: donor.name,
          bloodGroup: donor.bloodGroup,
          points: donor.points,
          lastDonationDate: donor.lastDonationDate,
        },
        appointment: {
          id: appointment._id,
          hospital: appointment.hospital,
          date: appointment.date,
          time: appointment.time,
        },
        eligibility: {
          eligible,
          nextEligibleDate,
        },
      },
    });
  } catch (error) {
    console.error('Verify QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify QR code',
    });
  }
};

const completeDonation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { qrCodeId } = req.body;

    if (!qrCodeId) {
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'QR code ID is required',
      });
    }

    // Step (a): Find QR code, reject if not found or already used
    const qrCode = await QRCode.findOne({ code: qrCodeId }).session(session);
    if (!qrCode) {
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'QR code not found',
      });
    }

    if (qrCode.used) {
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'QR code has already been used',
      });
    }

    // Step (b): Find appointment, reject if already completed
    const appointment = await Appointment.findById(qrCode.appointmentId).session(session);
    if (!appointment) {
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (appointment.completed) {
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This appointment has already been completed',
      });
    }

    // Step (c): Get donor (skip eligibility check for QR scanning)
    console.log('Finding donor with ID:', appointment.user);
    const donor = await User.findById(appointment.user).session(session);
    console.log('Found donor:', donor ? donor._id : 'null', 'current lastDonationDate:', donor ? donor.lastDonationDate : 'null');
    if (!donor) {
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Donor not found',
      });
    }

    // Skip eligibility check - allow officers to complete donations regardless
    // if (donor.lastDonationDate) {
    //   const lastDonation = new Date(donor.lastDonationDate);
    //   const nextEligible = new Date(lastDonation);
    //   nextEligible.setDate(nextEligible.getDate() + MIN_DAYS_BETWEEN_DONATIONS);
    //   const today = new Date();

    //   if (today < nextEligible) {
    //     session.endSession();
    //     return res.status(400).json({
    //       success: false,
    //       message: 'Donor is not eligible. Next eligible date: ' + nextEligible.toISOString().split('T')[0],
    //     });
    //   }
    // }

    // Step (e): MongoDB transaction
    // Update QR code
    const updatedQR = await QRCode.findOneAndUpdate(
      { code: qrCodeId, used: false },
      { used: true, usedAt: new Date() },
      { new: true, session }
    );

    if (!updatedQR) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'QR code already used',
      });
    }

    // Update appointment (only if completed: false)
    const updatedAppointment = await Appointment.findOneAndUpdate(
      { _id: appointment._id, completed: false },
      { completed: true, completedAt: new Date() },
      { new: true, session }
    );

    if (!updatedAppointment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Appointment already completed',
      });
    }

    // Update user (add points and set last donation date)
    console.log('Before update - donor._id:', donor._id, 'current lastDonationDate:', donor.lastDonationDate);
    await User.updateOne(
      { _id: donor._id },
      {
        $inc: { points: POINTS_PER_DONATION },
        $set: { lastDonationDate: new Date() },
      },
      { session }
    );
    console.log('After update - lastDonationDate set to:', new Date());

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Donation completed successfully',
      data: {
        pointsAwarded: POINTS_PER_DONATION,
        totalPoints: donor.points + POINTS_PER_DONATION,
      },
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error('Complete donation error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to complete donation',
    });
  }
};

const redeemReward = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { rewardId } = req.body;

    // Validate rewardId
    const reward = REWARDS[rewardId];
    if (!reward) {
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid reward ID',
      });
    }

    const cost = reward.points;

    // Check if user already redeemed this reward
    const existingRedemption = await Redemption.findOne({
      user: req.user._id,
      rewardId,
    }).session(session);

    if (existingRedemption) {
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'You have already redeemed this reward',
      });
    }

    // Deduct points from user
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user._id, points: { $gte: cost } },
      { $inc: { points: -cost } },
      { new: true, session }
    );

    if (!updatedUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Not enough points',
      });
    }

    // Create redemption record
    await Redemption.create(
      [
        {
          user: req.user._id,
          rewardId,
          rewardName: reward.name,
          cost,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Successfully redeemed ${reward.name}`,
      data: {
        points: updatedUser.points,
      },
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error('Redeem reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to redeem reward',
    });
  }
};

const getRedemptions = async (req, res) => {
  try {
    const redemptions = await Redemption.find({ user: req.user._id })
      .sort({ redeemedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: redemptions,
    });
  } catch (error) {
    console.error('Get redemptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch redemptions',
    });
  }
};

module.exports = {
  getDonorProfile,
  verifyQR,
  completeDonation,
  redeemReward,
  getRedemptions,
};
