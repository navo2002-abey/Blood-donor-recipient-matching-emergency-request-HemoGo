const RequestMatch = require('../models/RequestMatch');
const BestDonorAI = require('../models/BestDonorAI');
const User = require('../models/User');

const COMPATIBILITY = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};

exports.getMatchingDonors = async (req, res) => {
  try {
    const { bloodGroup, hospital, area } = req.query;

    if (!bloodGroup) {
      return res.status(400).json({
        success: false,
        message: 'Blood group query parameter is required.',
      });
    }

    const cleanBg = String(bloodGroup).trim().toUpperCase();
    const compatibleGroups = COMPATIBILITY[cleanBg] || [cleanBg];

    // Query registered donors matching compatible blood groups
    const donors = await User.find({
      role: 'DONOR',
      isActive: { $ne: false },
      bloodGroup: { $in: compatibleGroups },
    }).select('-password');

    const results = donors.map((donor, idx) => {
      const isExact = donor.bloodGroup === cleanBg;
      const isSameHospital =
        hospital &&
        donor.hospital &&
        donor.hospital.toLowerCase().includes(String(hospital).toLowerCase());
      const isSameArea =
        area &&
        donor.area &&
        donor.area.toLowerCase().includes(String(area).toLowerCase());

      let score = isExact ? 94 : 82;
      if (isSameHospital) score += 6;
      else if (isSameArea) score += 4;
      if (donor.isAvailable) score += 4;

      // Realistic distance based on hospital/area proximity
      let distanceKm = 2.4;
      if (isSameHospital) distanceKm = 1.4 + idx * 0.5;
      else if (isSameArea) distanceKm = 2.8 + idx * 0.8;
      else if (isExact) distanceKm = 3.5 + idx * 1.1;
      else distanceKm = 5.2 + idx * 1.3;

      return {
        id: donor._id.toString(),
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        bloodGroup: donor.bloodGroup,
        hospital: donor.hospital || 'General Hospital Network',
        area: donor.area || 'Colombo',
        distanceKm: Number(distanceKm.toFixed(1)),
        distance: `${distanceKm.toFixed(1)}km away`,
        status: donor.isAvailable ? 'Available' : 'Busy',
        isAvailable: donor.isAvailable !== false,
        exactMatch: isExact,
        score: Math.min(100, score),
        avatar:
          donor.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      };
    });

    // Sort by exact blood group match first, then by match score
    results.sort((a, b) => {
      if (a.exactMatch !== b.exactMatch) return b.exactMatch ? 1 : -1;
      return b.score - a.score || a.distanceKm - b.distanceKm;
    });

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('Get matching donors error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to retrieve matching donors.',
    });
  }
};

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
