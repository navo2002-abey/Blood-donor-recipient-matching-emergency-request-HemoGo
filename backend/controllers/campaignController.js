const Campaign = require('../models/Campaign');

exports.createCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, campaign });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getCampaigns = async (req, res) => {
  const campaigns = await Campaign.find().sort({ createdAt: -1 });
  res.json({ success: true, count: campaigns.length, campaigns });
};

exports.updateCampaign = async (req, res) => {
  const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!campaign) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, campaign });
};

exports.deleteCampaign = async (req, res) => {
  await Campaign.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deleted' });
};