const BloodStock = require('../models/BloodStock');

// Simple heuristic-based prediction (can be replaced with real AI later)
exports.getPredictions = async (req, res) => {
  const stock = await BloodStock.find({ status: 'AVAILABLE' });

  const groups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  const predictions = groups.map((bg) => {
    const total = stock
      .filter((s) => s.bloodGroup === bg)
      .reduce((sum, s) => sum + s.units, 0);

    let risk = 'LOW';
    let days = 14;
    if (total <= 2) { risk = 'CRITICAL'; days = 2; }
    else if (total <= 5) { risk = 'HIGH'; days = 3; }
    else if (total <= 10) { risk = 'MEDIUM'; days = 5; }

    return {
      bloodGroup: bg,
      currentStock: total,
      riskLevel: risk,
      predictedDays: days,
      reason:
        risk === 'CRITICAL' ? 'Critical shortage imminent.' :
        risk === 'HIGH' ? 'Increased demand expected.' :
        risk === 'MEDIUM' ? 'Monitor stock levels.' : 'Stock sufficient.',
      recommendedAction:
        risk === 'CRITICAL' ? 'Request emergency transfer.' :
        risk === 'HIGH' ? 'Organize donation drive.' :
        risk === 'MEDIUM' ? 'Prepare reserve stock.' : 'No action needed.',
    };
  });

  // Only return medium/high/critical
  const filtered = predictions
    .filter((p) => p.riskLevel !== 'LOW')
    .sort((a, b) => a.predictedDays - b.predictedDays);

  res.json({ success: true, predictions: filtered });
};