const Campaign = require('../models/Campaign');

// CREATE
exports.createCampaign = async (req, res) => {
  try {
    const { name, targetBloodGroups, preferredDate, venue, hospitalName, reason } = req.body;

    if (!name || !preferredDate || !venue?.name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (name, preferredDate, venue.name).',
      });
    }

    if (!Array.isArray(targetBloodGroups) || targetBloodGroups.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one target blood group is required.',
      });
    }

    const campaign = await Campaign.create({
      name,
      targetBloodGroups,
      preferredDate: new Date(preferredDate),
      venue,
      hospitalName: hospitalName || null,
      suggestedByAI: true,
      reason: reason || `Shortage for ${targetBloodGroups.join(', ')}`,
      status: 'PUBLISHED',
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, campaign });
  } catch (err) {
    console.error('Create campaign error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

// READ all
exports.getCampaigns = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.hospital) filter.hospitalName = req.query.hospital;

    const campaigns = await Campaign.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: campaigns.length, campaigns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// READ one
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, campaign });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE
exports.updateCampaign = async (req, res) => {
  try {
    const { targetBloodGroups, preferredDate, venue } = req.body;

    if (targetBloodGroups && (!Array.isArray(targetBloodGroups) || targetBloodGroups.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'At least one target blood group is required.',
      });
    }

    const updates = { ...req.body, updatedBy: req.user._id };
    if (preferredDate) updates.preferredDate = new Date(preferredDate);

    const campaign = await Campaign.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    res.json({ success: true, campaign });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};