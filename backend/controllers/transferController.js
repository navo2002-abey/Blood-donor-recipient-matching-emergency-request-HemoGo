const TransferRequest = require('../models/TransferRequest');
const BloodStock = require('../models/BloodStock');
const Reservation = require('../models/Reservation');

// ============================================================
// CREATE
// ============================================================
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

// ============================================================
// READ
// ============================================================
exports.getTransfers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.sourceBank) filter.sourceBank = req.query.sourceBank;
    if (req.query.destinationHospital)
      filter.destinationHospital = req.query.destinationHospital;

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

// ============================================================
// STATE TRANSITIONS
// ============================================================

/**
 * PENDING → APPROVED
 * - Decrement source bank stock (FIFO — earliest expiry first)
 * - Record each consumed batch (with its ORIGINAL expiry) on transfer.sourceBatches
 * - Create a RESERVED reservation at destination (in-transit hold)
 */
const moveToApproved = async (transfer, user) => {
  const requestedUnits = transfer.units || 1;

  // Get all AVAILABLE batches at source, oldest expiry first
  const sourceBatches = await BloodStock.find({
    bloodGroup: transfer.bloodGroup,
    hospital: transfer.sourceBank,
    status: 'AVAILABLE',
    units: { $gt: 0 },
  }).sort({ expiryDate: 1 });

  const totalAvailable = sourceBatches.reduce((s, b) => s + b.units, 0);
  if (totalAvailable < requestedUnits) {
    throw new Error(
      `Insufficient ${transfer.bloodGroup} stock at source bank. Available: ${totalAvailable}, needed: ${requestedUnits}.`
    );
  }

  let remaining = requestedUnits;
  const drawnBatches = [];

  for (const batch of sourceBatches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.units, remaining);

    // ✅ Record the source expiry for THIS slice
    drawnBatches.push({
      expiryDate: batch.expiryDate,
      units: take,
    });

    batch.units -= take;
    if (batch.units === 0) batch.status = 'TRANSFERRED';
    await batch.save();
    remaining -= take;
  }

  // Save the drawn batches on the transfer
  transfer.sourceBatches = drawnBatches;

  // Create a reservation at destination (in-transit hold)
  await Reservation.create({
    unitId: `TRF-${transfer._id.toString().slice(-6)}`,
    bloodGroup: transfer.bloodGroup,
    units: requestedUnits,
    patientName: `Incoming from ${transfer.sourceBank}`,
    ward: 'Blood Bank Storage',
    hospital: transfer.destinationHospital,
    reservedFor: `Transfer ${transfer._id.toString().slice(-6)}`,
    status: 'RESERVED',
    reservedBy: user._id,
    isTransfer: true,
    transferId: transfer._id,
  });

  transfer.approvedBy = user._id;
  transfer.approvedAt = new Date();
};

/**
 * APPROVED → DELIVERED
 * - Just record the timestamp — reservation stays RESERVED
 * - Destination officer will confirm receipt next
 */
const moveToDelivered = async (transfer, user) => {
  transfer.deliveredBy = user._id;
  transfer.deliveredAt = new Date();
};

/**
 * DELIVERED → COMPLETED
 * - Release the destination reservation (mark USED)
 * - Add stock to destination using the SAME expiry dates from sourceBatches
 *   (merged into existing batches with matching expiry, or new batches)
 */
const moveToCompleted = async (transfer, user) => {
  // 1. Release reservation
  await Reservation.updateOne(
    { transferId: transfer._id, status: 'RESERVED' },
    { status: 'USED' }
  );

  // 2. Add each drawn batch to destination with SAME expiry
  const drawnBatches = transfer.sourceBatches || [];

  // Fallback: if sourceBatches wasn't recorded (old transfers), use a 30-day default
  if (drawnBatches.length === 0) {
    drawnBatches.push({
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      units: transfer.units || 1,
    });
  }

  for (const sb of drawnBatches) {
    // Find existing destination batch with the SAME blood group + SAME expiry
    const existing = await BloodStock.findOne({
      bloodGroup: transfer.bloodGroup,
      hospital: transfer.destinationHospital,
      expiryDate: sb.expiryDate,
    });

    if (existing) {
      existing.units += sb.units;
      if (existing.status === 'TRANSFERRED') {
        existing.status = 'AVAILABLE';
      }
      await existing.save();
    } else {
      // Create a new batch with the SAME expiry from source
      await BloodStock.create({
        bloodGroup: transfer.bloodGroup,
        units: sb.units,
        expiryDate: sb.expiryDate,
        hospital: transfer.destinationHospital,
        status: 'AVAILABLE',
        updatedBy: user._id,
      });
    }
  }

  transfer.confirmedBy = user._id;
  transfer.confirmedAt = new Date();
};

/**
 * ANY → CANCELLED
 * If previously APPROVED/DELIVERED: restore source stock with SAME expiry
 * and release the destination reservation.
 */
const moveToCancelled = async (transfer, user) => {
  if (transfer.status === 'APPROVED' || transfer.status === 'DELIVERED') {
    const drawnBatches = transfer.sourceBatches || [];

    // Restore each drawn slice back to source with original expiry
    for (const sb of drawnBatches) {
      const restored = await BloodStock.findOne({
        bloodGroup: transfer.bloodGroup,
        hospital: transfer.sourceBank,
        expiryDate: sb.expiryDate,
      });

      if (restored) {
        restored.units += sb.units;
        if (restored.status === 'TRANSFERRED') {
          restored.status = 'AVAILABLE';
        }
        await restored.save();
      } else {
        // Recreate batch with original expiry
        await BloodStock.create({
          bloodGroup: transfer.bloodGroup,
          units: sb.units,
          expiryDate: sb.expiryDate,
          hospital: transfer.sourceBank,
          status: 'AVAILABLE',
          updatedBy: user._id,
        });
      }
    }

    // Release destination reservation
    await Reservation.updateOne(
      { transferId: transfer._id, status: 'RESERVED' },
      { status: 'RELEASED' }
    );
  }
};

// ============================================================
// UPDATE (routes to correct handler)
// ============================================================
exports.updateTransfer = async (req, res) => {
  try {
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const previousStatus = transfer.status;
    const newStatus = req.body.status || previousStatus;

    // No-op transition — just update fields
    if (newStatus === previousStatus) {
      Object.assign(transfer, req.body);
      await transfer.save();
      return res.json({ success: true, transfer });
    }

    // Route based on state transition
    if (previousStatus === 'PENDING' && newStatus === 'APPROVED') {
      await moveToApproved(transfer, req.user);
    } else if (previousStatus === 'APPROVED' && newStatus === 'DELIVERED') {
      await moveToDelivered(transfer, req.user);
    } else if (previousStatus === 'DELIVERED' && newStatus === 'COMPLETED') {
      await moveToCompleted(transfer, req.user);
    } else if (newStatus === 'CANCELLED') {
      await moveToCancelled(transfer, req.user);
    }

    Object.assign(transfer, req.body);
    await transfer.save();

    return res.json({ success: true, transfer });
  } catch (err) {
    console.error('Update transfer error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================================
// DELETE
// ============================================================
exports.deleteTransfer = async (req, res) => {
  try {
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    // If mid-flight, cleanup first
    if (transfer.status === 'APPROVED' || transfer.status === 'DELIVERED') {
      await moveToCancelled(transfer, req.user);
    }

    await TransferRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Transfer deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};