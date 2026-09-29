const TransferRequest = require('../models/TransferRequest');

exports.createTransfer = async (req, res) => {
  try {
    const transfer = await TransferRequest.create({
      ...req.body,
      requestedBy: req.user._id,
    });
    res.status(201).json({ success: true, transfer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getTransfers = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.sourceBank) filter.sourceBank = req.query.sourceBank;
  const transfers = await TransferRequest.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: transfers.length, transfers });
};

exports.updateTransfer = async (req, res) => {
  const transfer = await TransferRequest.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!transfer) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, transfer });
};

exports.deleteTransfer = async (req, res) => {
  await TransferRequest.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Cancelled' });
};