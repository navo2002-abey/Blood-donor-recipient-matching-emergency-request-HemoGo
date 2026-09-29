const User = require('../models/User');

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

module.exports = { getStats };
