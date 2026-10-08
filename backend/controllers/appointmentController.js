const crypto = require('crypto');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const QRCode = require('../models/QRCode');
const User = require('../models/User');

const createAppointment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { hospital, date, time } = req.body;

    // Validate required fields
    if (!hospital || !date || !time) {
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Hospital, date, and time are required',
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Date must be in YYYY-MM-DD format',
      });
    }

    // Validate date is not in the past
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appointmentDate < today) {
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Appointment date cannot be in the past',
      });
    }

    // Validate time is non-empty string
    if (typeof time !== 'string' || time.trim() === '') {
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Time is required and cannot be empty',
      });
    }

    // Generate unique QR code ID
    const qrCodeId = `HG-${crypto.randomBytes(8).toString('hex')}`;

    // Create appointment
    const appointment = await Appointment.create(
      [
        {
          user: req.user._id,
          hospital,
          date,
          time,
          qrCodeId,
        },
      ],
      { session }
    );

    // Create QR code
    await QRCode.create(
      [
        {
          code: qrCodeId,
          appointmentId: appointment[0]._id,
        },
      ],
      { session }
    );

    // Update user's last appointment date
    await User.updateOne(
      { _id: req.user._id },
      { $set: { lastAppointmentDate: new Date(date) } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: appointment[0],
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error('Create appointment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
    });
  }
};

const getAppointmentHistory = async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user._id })
      .sort({ bookedAt: -1 })
      .populate('user', 'name email phone bloodGroup');

    res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error('Get appointment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment history',
    });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Check if appointment belongs to the user
    if (appointment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this appointment',
      });
    }


    // Delete associated QR code
    await QRCode.deleteOne({ appointmentId: id });

    // Delete appointment
    await Appointment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete appointment',
    });
  }
};

module.exports = {
  createAppointment,
  getAppointmentHistory,
  deleteAppointment,
};
