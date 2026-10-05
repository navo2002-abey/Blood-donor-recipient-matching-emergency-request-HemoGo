const RequestMatch = require('../models/RequestMatch');
const BestDonorAI = require('../models/BestDonorAI');

exports.createRequestMatch = async (req, res) => {
  try {
    const { patientName, hospital, bloodGroup, urgency, additionalDetails } = req.body;

    if (!patientName || !hospital || !bloodGroup || !urgency) {
      return res.status(400).json({
        success: false,
        message: 'Patient name, hospital, blood group, and urgency are required.',
      });
    }

    const match = await RequestMatch.create({
      patientName: String(patientName).trim(),
      hospital: String(hospital).trim(),
      bloodGroup,
      urgency,
      additionalDetails: String(additionalDetails || '').trim(),
      requestedBy: req.user?._id || null,
      requesterName: req.user?.name || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Request match saved.',
      data: match,
    });
  } catch (error) {
    console.error('Create request match error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to save the request match.',
    });
  }
};

exports.saveBestDonors = async (req, res) => {
  try {
    const { requestMatchId, donors } = req.body;

    if (!requestMatchId || !Array.isArray(donors)) {
      return res.status(400).json({
        success: false,
        message: 'Request match and donor results are required.',
      });
    }

    const match = await RequestMatch.findById(requestMatchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Request match was not found.',
      });
    }

    const rows = donors.slice(0, 3).map((donor, index) => ({
      requestMatchId: match._id,
      rank: index + 1,
      donorId: donor.id || donor.donorId || '',
      donorName: donor.name || donor.donorName,
      bloodGroup: donor.bloodGroup,
      distanceKm: Number(donor.distanceKm) || 0,
      hospital: donor.hospital || '',
      available: Boolean(donor.available),
      score: Number(donor.score) || 0,
      exact: Boolean(donor.exact),
      matchedHospital: Boolean(donor.matchedHospital),
      reason: donor.reason || '',
      requestedBy: req.user?._id || null,
    }));

    if (rows.some((row) => !row.donorName || !row.bloodGroup)) {
      return res.status(400).json({
        success: false,
        message: 'Each AI result needs a donor name and blood group.',
      });
    }

    await BestDonorAI.deleteMany({ requestMatchId: match._id });
    const saved = rows.length ? await BestDonorAI.insertMany(rows) : [];

    return res.status(201).json({
      success: true,
      message: 'Best donor results saved.',
      count: saved.length,
      data: saved,
    });
  } catch (error) {
    console.error('Save best donors error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to save the AI donor results.',
    });
  }
};
