const BloodBank = require('../models/BloodBank');
const BloodStock = require('../models/BloodStock');

exports.getBloodBanks = async (req, res) => {
  const banks = await BloodBank.find();
  const banksWithStock = await Promise.all(
    banks.map(async (bank) => {
      const stock = await BloodStock.find({ hospital: bank.name, status: 'AVAILABLE' });
      const stockMap = {};
      stock.forEach((s) => { stockMap[s.bloodGroup] = (stockMap[s.bloodGroup] || 0) + s.units; });
      return { ...bank.toObject(), stock: stockMap };
    })
  );
  res.json({ success: true, count: banksWithStock.length, bloodBanks: banksWithStock });
};

exports.getBloodBankById = async (req, res) => {
  const bank = await BloodBank.findById(req.params.id);
  if (!bank) return res.status(404).json({ success: false, message: 'Not found' });
  const stock = await BloodStock.find({ hospital: bank.name, status: 'AVAILABLE' });
  res.json({ success: true, bloodBank: { ...bank.toObject(), stock } });
};

exports.createBloodBank = async (req, res) => {
  const bank = await BloodBank.create(req.body);
  res.status(201).json({ success: true, bloodBank: bank });
};

exports.updateBloodBank = async (req, res) => {
  const bank = await BloodBank.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, bloodBank: bank });
};

exports.deleteBloodBank = async (req, res) => {
  await BloodBank.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deleted' });
};