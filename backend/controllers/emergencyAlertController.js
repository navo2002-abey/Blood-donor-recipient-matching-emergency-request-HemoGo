const mongoose = require('mongoose');
const EmergencyAlert = require('../models/EmergencyAlert');

const findAlertSafely = async (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    return await EmergencyAlert.findById(id);
  }
  return await EmergencyAlert.findOne({
    $or: [{ requestId: id }],
  });
};

exports.dispatchAlert = async (req, res) => {
  try {
    const payload = req.body || {};

    const alert = await EmergencyAlert.create({
      targetEmail: (payload.targetEmail || '').toLowerCase().trim(),
      targetUserId: payload.targetUserId || null,
      targetName: payload.targetName || 'Donor',
      targetPhone: payload.targetPhone || '',
      targetAll: Boolean(payload.targetAll),
      targetDonors: Array.isArray(payload.targetDonors) ? payload.targetDonors : [],
      senderEmail: (payload.senderEmail || req.user?.email || '').toLowerCase().trim(),
      senderName: payload.senderName || req.user?.name || 'Requester',
      senderId: payload.senderId || req.user?._id?.toString() || null,
      bloodGroup: payload.bloodGroup || 'O+',
      hospital: payload.hospital || 'National Hospital Colombo',
      patientName: payload.patientName || 'Patient',
      phone: payload.phone || '071-2345678',
      requestId: payload.requestId || 'REQ-2026-001',
      requestData: payload.requestData || {},
      location: payload.location || { latitude: 6.9271, longitude: 79.8612 },
      status: 'PENDING',
    });

    return res.status(201).json({
      success: true,
      message: 'Emergency alert dispatched successfully',
      data: alert,
    });
  } catch (error) {
    console.error('Dispatch alert error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispatch alert',
    });
  }
};

exports.getPendingAlertsForUser = async (req, res) => {
  try {
    const email = (req.query.email || req.user?.email || '').toLowerCase().trim();
    const userId = (req.query.userId || req.user?._id?.toString() || '').trim();
    const phone = (req.query.phone || req.user?.phone || '').replace(/\s+/g, '');

    if (!email && !userId && !phone) {
      return res.status(200).json({ success: true, data: [] });
    }

    const conditions = [];

    if (email) {
      conditions.push({ targetEmail: email });
      conditions.push({ 'targetDonors.email': email });
    }
    if (userId) {
      conditions.push({ targetUserId: userId });
      conditions.push({ 'targetDonors.id': userId });
    }
    if (phone) {
      conditions.push({ targetPhone: phone });
    }
    // Also include targetAll broadcasts where sender is someone else
    conditions.push({ targetAll: true });

    const alerts = await EmergencyAlert.find({
      status: 'PENDING',
      $or: conditions,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // Filter out if current user was the sender or if user already dismissed it
    const activeAlerts = alerts.filter((a) => {
      const isSender =
        (email && a.senderEmail === email) ||
        (userId && String(a.senderId) === userId);
      if (isSender) return false;

      const isDismissed =
        (email && a.dismissedBy?.includes(email)) ||
        (userId && a.dismissedBy?.includes(userId));
      if (isDismissed) return false;

      return true;
    });

    return res.status(200).json({
      success: true,
      data: activeAlerts,
    });
  } catch (error) {
    console.error('Get pending alerts error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch pending alerts',
    });
  }
};

exports.dismissAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const email = (req.body.email || req.user?.email || '').toLowerCase().trim();

    const alert = await findAlertSafely(id);
    if (!alert) {
      return res.status(200).json({ success: true, message: 'Alert dismissed (simulated)' });
    }

    if (email && !alert.dismissedBy.includes(email)) {
      alert.dismissedBy.push(email);
      await alert.save();
    }

    return res.status(200).json({ success: true, message: 'Alert dismissed' });
  } catch (error) {
    return res.status(200).json({ success: true, message: 'Alert dismissed' });
  }
};

exports.acceptAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const email = (req.body.email || req.user?.email || '').toLowerCase().trim();

    const alert = await findAlertSafely(id);
    if (!alert) {
      return res.status(200).json({ success: true, message: 'Alert accepted (simulated)' });
    }

    alert.status = 'ACCEPTED';
    if (email && !alert.dismissedBy.includes(email)) {
      alert.dismissedBy.push(email);
    }
    await alert.save();

    return res.status(200).json({ success: true, message: 'Alert accepted', data: alert });
  } catch (error) {
    return res.status(200).json({ success: true, message: 'Alert accepted' });
  }
};
