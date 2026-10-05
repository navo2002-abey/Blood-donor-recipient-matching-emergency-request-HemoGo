const Reservation = require('../models/Reservation');
const BloodStock = require('../models/BloodStock');

/**
 * CREATE reservation.
 * Automatically:
 *  - Finds oldest-expiring AVAILABLE batch with enough units
 *  - Decrements that batch
 *  - Stores stockId on the reservation
 */
exports.createReservation = async (req, res) => {
  try {
    const {
      unitId,
      bloodGroup,
      units = 1,
      patientName,
      ward,
      hospital,
      reservedFor,
      stockId,
    } = req.body;

    if (!bloodGroup || !patientName || !ward || !hospital) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (bloodGroup, patientName, ward, hospital).',
      });
    }

    const requestedUnits = Math.max(1, Number(units) || 1);

    // Find the batch to reserve from
    let batch;
    if (stockId) {
      // User picked a specific batch
      batch = await BloodStock.findOne({
        _id: stockId,
        status: 'AVAILABLE',
        units: { $gte: requestedUnits },
      });
      if (!batch) {
        return res.status(400).json({
          success: false,
          message: 'Selected batch has insufficient units.',
        });
      }
    } else {
      // Auto-pick: earliest expiry first with enough units
      batch = await BloodStock.findOne({
        bloodGroup,
        hospital,
        status: 'AVAILABLE',
        units: { $gte: requestedUnits },
      }).sort({ expiryDate: 1 });
    }

    if (!batch) {
      return res.status(400).json({
        success: false,
        message: `No available ${bloodGroup} stock (need ${requestedUnits} unit${
          requestedUnits > 1 ? 's' : ''
        }).`,
      });
    }

    // Decrement the batch
    batch.units -= requestedUnits;
    await batch.save();

    // Create the reservation
    const reservation = await Reservation.create({
      unitId,
      stockId: batch._id,
      bloodGroup,
      units: requestedUnits,
      patientName,
      ward,
      hospital,
      reservedFor,
      status: 'RESERVED',
      reservedBy: req.user._id,
    });

    return res.status(201).json({ success: true, reservation });
  } catch (err) {
    console.error('Create reservation error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

// READ
exports.getReservations = async (req, res) => {
  try {
    const filter = {};
    if (req.query.hospital) filter.hospital = req.query.hospital;
    if (req.query.status) filter.status = req.query.status;

    // ✅ By default, exclude auto-generated transfer reservations
    // Pass ?includeTransfers=true to see them
    if (req.query.includeTransfers !== 'true') {
      filter.isTransfer = { $ne: true };
    }

    const reservations = await Reservation.find(filter)
      .populate('stockId', 'bloodGroup units expiryDate status')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: reservations.length, reservations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE — Release / Mark Used
exports.updateReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const previousStatus = reservation.status;
    const newStatus = req.body.status || previousStatus;

    // If moving from RESERVED → RELEASED, return units to the batch
    if (previousStatus === 'RESERVED' && newStatus === 'RELEASED') {
      if (reservation.stockId) {
        await BloodStock.findByIdAndUpdate(reservation.stockId, {
          $inc: { units: reservation.units || 1 },
        });
      } else {
        // Fallback: increment first matching batch
        await BloodStock.findOneAndUpdate(
          { bloodGroup: reservation.bloodGroup, hospital: reservation.hospital },
          { $inc: { units: reservation.units || 1 } }
        );
      }
    }

    // If moving from RESERVED → USED, units are consumed, no stock change

    Object.assign(reservation, req.body);
    await reservation.save();

    return res.json({ success: true, reservation });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE — cancels reservation and returns units to stock if still RESERVED
exports.deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    if (reservation.status === 'RESERVED') {
      if (reservation.stockId) {
        await BloodStock.findByIdAndUpdate(reservation.stockId, {
          $inc: { units: reservation.units || 1 },
        });
      } else {
        await BloodStock.findOneAndUpdate(
          { bloodGroup: reservation.bloodGroup, hospital: reservation.hospital },
          { $inc: { units: reservation.units || 1 } }
        );
      }
    }

    await Reservation.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Cancelled and units returned' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};