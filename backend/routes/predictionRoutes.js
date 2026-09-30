const express = require('express');
const { getPredictions } = require('../controllers/predictionController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Only Blood Bank Officers and Admins can view AI shortage predictions
router.get('/', protect, authorize('BLOOD_BANK_OFFICER', 'ADMIN'), getPredictions);

module.exports = router;