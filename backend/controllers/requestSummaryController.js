const RequestSummary = require('../models/RequestSummary');

const makeRequestId = () => {
  const year = new Date().getFullYear();
  const serial = String(Math.floor(1000 + Math.random() * 9000));
  return `#RG-${year}-${serial}`;
};

exports.createRequestSummary = async (req, res) => {
  try {
    const {
      bloodType,
      unitsRequired,
      location,
      additionalDetails,
      donorId,
      donorName,
      donorPhone,
      donorHospital,
      donorArea,
    } = req.body;

    if (!bloodType || !location || !donorName) {
      return res.status(400).json({
        success: false,
        message: 'Blood type, location, and donor name are required.',
      });
    }

    const requestedAt = new Date();
    let summary = null;

    for (let attempt = 0; attempt < 3 && !summary; attempt += 1) {
      try {
        summary = await RequestSummary.create({
          requestId: makeRequestId(),
          bloodType,
          unitsRequired: Math.max(1, Number(unitsRequired) || 1),
          location: String(location).trim(),
          additionalDetails: String(additionalDetails || '').trim(),
          requestedAt,
          donorId: donorId || '',
          donorName: String(donorName).trim(),
          donorPhone: donorPhone || '',
          donorHospital: donorHospital || '',
          donorArea: donorArea || '',
          requestedBy: req.user?._id || null,
          requesterName: req.user?.name || '',
        });
      } catch (error) {
        if (error.code !== 11000 || attempt === 2) {
          throw error;
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Request summary saved.',
      data: summary,
    });
  } catch (error) {
    console.error('Create request summary error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to save the request.',
    });
  }
};
