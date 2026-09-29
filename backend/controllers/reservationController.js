const Reservation = require('../models/Reservation');
const BloodStock = require('../models/BloodStock');

// CREATE reservation (also decrements available stock)
exports.createReservation = async (req, res) => {
  try {
    const reservation = await Reservation.create({
      ...req.body,
      reservedBy: req.user._id,
    });

    // Decrement available stock for that blood group + hospital
    await BloodStock.findOneAndUpdate(
      { bloodGroup: req.body.bloodGroup, hospital: req.body.hospital },
      { $inc: { units: -req.body.units || -1 } }
    );

    res.status(201).json({ success: true, reservation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// READ
exports.getReservations = async (req, res) => {
  const filter = {};
  if (req.query.hospital) filter.hospital = req.query.hospital;
  if (req.query.status) filter.status = req.query.status;
  const reservations = await Reservation.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: reservations.length, reservations });
};

// UPDATE — Release / Mark Used
exports.updateReservation = async (req, res) => {
  const reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!reservation) return res.status(404).json({ success: false, message: 'Not found' });

  // If released, return unit to available stock
  if (req.body.status === 'RELEASED') {
    await BloodStock.findOneAndUpdate(
      { bloodGroup: reservation.bloodGroup, hospital: reservation.hospital },
      { $inc: { units: 1 } }
    );
  }
  res.json({ success: true, reservation });
};

// DELETE
exports.deleteReservation = async (req, res) => {
  await Reservation.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Cancelled' });
};