const BloodStock = require('../models/BloodStock');

// CREATE stock
exports.createStock = async (req, res) => {
  try {
    const stock = await BloodStock.create({
      ...req.body,
      updatedBy: req.user._id,
    });
    res.status(201).json({ success: true, stock });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// READ all stock for a hospital
exports.getStock = async (req, res) => {
  try {
    const filter = {};
    if (req.query.hospital) filter.hospital = req.query.hospital;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.bloodGroup) filter.bloodGroup = req.query.bloodGroup;

    const stock = await BloodStock.find(filter).sort({
      bloodGroup: 1,
      expiryDate: 1,
    });
    res.json({ success: true, count: stock.length, stock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// READ single
exports.getStockById = async (req, res) => {
  const stock = await BloodStock.findById(req.params.id);
  if (!stock) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, stock });
};

// UPDATE
exports.updateStock = async (req, res) => {
  try {
    const stock = await BloodStock.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!stock) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, stock });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE
exports.deleteStock = async (req, res) => {
  const stock = await BloodStock.findByIdAndDelete(req.params.id);
  if (!stock) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Deleted' });
};

// Expiry monitoring — units expiring within N days
// Expiry monitoring — units expiring within N days (or already expired)
exports.getExpiring = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const threshold = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Optional hospital filter
    const filter = {
      status: { $in: ['AVAILABLE', 'EXPIRED'] },
      units: { $gt: 0 },
      expiryDate: { $lte: threshold }, // any date up to the threshold (includes past)
    };
    if (req.query.hospital) filter.hospital = req.query.hospital;

    const stock = await BloodStock.find(filter).sort({ expiryDate: 1 });

    // Tag each row with computed urgency so frontend doesn't need to recalculate
    const now = Date.now();
    const enriched = stock.map((s) => {
      const obj = s.toObject();
      const diff = new Date(s.expiryDate).getTime() - now;
      const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
      obj.daysLeft = daysLeft;
      obj.isExpired = daysLeft <= 0;
      obj.urgency =
        daysLeft <= 0
          ? 'EXPIRED'
          : daysLeft <= 3
          ? 'CRITICAL'
          : daysLeft <= 7
          ? 'HIGH'
          : daysLeft <= 14
          ? 'MEDIUM'
          : 'LOW';
      return obj;
    });

    res.json({ success: true, count: enriched.length, stock: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ NEW: Available batches — for the Create Reservation batch picker
exports.getAvailableBatches = async (req, res) => {
  try {
    const filter = { status: 'AVAILABLE', units: { $gt: 0 } };
    if (req.query.hospital) filter.hospital = req.query.hospital;
    if (req.query.bloodGroup) filter.bloodGroup = req.query.bloodGroup;

    const batches = await BloodStock.find(filter).sort({ expiryDate: 1 });
    res.json({ success: true, count: batches.length, batches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};