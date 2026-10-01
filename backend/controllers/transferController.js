const TransferRequest = require('../models/TransferRequest');
const BloodStock = require('../models/BloodStock');

// CREATE transfer
exports.createTransfer = async (req, res) => {
  try {
    const transfer = await TransferRequest.create({
      ...req.body,
      status: 'PENDING',
      requestedBy: req.user._id,
    });
    res.status(201).json({ success: true, transfer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// READ all transfers (with optional filters)
exports.getTransfers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.sourceBank) filter.sourceBank = req.query.sourceBank;
    if (req.query.destinationHospital)
      filter.destinationHospital = req.query.destinationHospital;

    // Incoming/outgoing filter for a specific hospital
    if (req.query.hospital) {
      filter.$or = [
        { sourceBank: req.query.hospital },
        { destinationHospital: req.query.hospital },
      ];
    }

    const transfers = await TransferRequest.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: transfers.length, transfers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE — handles stock movement when status changes
exports.updateTransfer = async (req, res) => {
  try {
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const previousStatus = transfer.status;
    const newStatus = req.body.status || previousStatus;

    // ✅ Move stock when APPROVED (or COMPLETED)
    const movingToApprovedOrCompleted =
      (newStatus === 'APPROVED' || newStatus === 'COMPLETED') &&
      previousStatus !== 'APPROVED' &&
      previousStatus !== 'COMPLETED';

    if (movingToApprovedOrCompleted) {
      const units = transfer.units || 1;

      // 1. Decrement source bank's stock for that blood group (oldest batches first)
      let remaining = units;
      const sourceBatches = await BloodStock.find({
        bloodGroup: transfer.bloodGroup,
        hospital: transfer.sourceBank,
        status: 'AVAILABLE',
        units: { $gt: 0 },
      }).sort({ expiryDate: 1 });

      for (const batch of sourceBatches) {
        if (remaining <= 0) break;
        const take = Math.min(batch.units, remaining);
        batch.units -= take;
        if (batch.units === 0) batch.status = 'TRANSFERRED';
        await batch.save();
        remaining -= take;
      }

      if (remaining > 0) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${transfer.bloodGroup} stock at source bank.`,
        });
      }

      // 2. Increment destination hospital's stock (create or add to a batch)
      const destBatch = await BloodStock.findOne({
        bloodGroup: transfer.bloodGroup,
        hospital: transfer.destinationHospital,
        status: 'AVAILABLE',
      }).sort({ expiryDate: 1 });

      if (destBatch) {
        destBatch.units += units;
        await destBatch.save();
      } else {
        // Create new batch at destination — 30-day expiry
        await BloodStock.create({
          bloodGroup: transfer.bloodGroup,
          units,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          hospital: transfer.destinationHospital,
          status: 'AVAILABLE',
          updatedBy: req.user._id,
        });
      }
    }

    // Update the transfer record
    Object.assign(transfer, req.body);
    await transfer.save();

    return res.json({ success: true, transfer });
  } catch (err) {
    console.error('Update transfer error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE
exports.deleteTransfer = async (req, res) => {
  try {
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    await TransferRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Transfer deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};