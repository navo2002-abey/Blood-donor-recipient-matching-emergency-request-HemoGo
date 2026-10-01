const BloodBank = require('../models/BloodBank');
const BloodStock = require('../models/BloodStock');

/**
 * Aggregates blood stock by hospital → bloodGroup → total units.
 * Returns a plain object of { bloodGroup: number }.
 */
const buildStockMap = (batches) => {
  const map = {};
  batches.forEach((b) => {
    const units = Number(b.units) || 0;
    if (units <= 0) return;
    map[b.bloodGroup] = (map[b.bloodGroup] || 0) + units;
  });
  return map;
};

exports.getBloodBanks = async (req, res) => {
  try {
    const banks = await BloodBank.find().lean();
    const stocks = await BloodStock.find({
      status: 'AVAILABLE',
      units: { $gt: 0 },
    }).lean();

    // Group by hospital name
    const byHospital = {};
    stocks.forEach((s) => {
      if (!byHospital[s.hospital]) byHospital[s.hospital] = [];
      byHospital[s.hospital].push(s);
    });

    const banksWithStock = banks.map((bank) => ({
      ...bank,
      stock: buildStockMap(byHospital[bank.name] || []),
    }));

    res.json({
      success: true,
      count: banksWithStock.length,
      bloodBanks: banksWithStock,
    });
  } catch (err) {
    console.error('getBloodBanks error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBloodBankById = async (req, res) => {
  try {
    const bank = await BloodBank.findById(req.params.id).lean();
    if (!bank) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const stocks = await BloodStock.find({
      hospital: bank.name,
      status: 'AVAILABLE',
      units: { $gt: 0 },
    }).lean();

    res.json({
      success: true,
      bloodBank: { ...bank, stock: buildStockMap(stocks) },
    });
  } catch (err) {
    console.error('getBloodBankById error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createBloodBank = async (req, res) => {
  try {
    const bank = await BloodBank.create(req.body);
    res.status(201).json({ success: true, bloodBank: { ...bank.toObject(), stock: {} } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateBloodBank = async (req, res) => {
  try {
    const bank = await BloodBank.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, bloodBank: bank });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteBloodBank = async (req, res) => {
  try {
    await BloodBank.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};