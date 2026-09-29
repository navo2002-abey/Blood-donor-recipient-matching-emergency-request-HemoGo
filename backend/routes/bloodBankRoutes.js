const express = require('express');
const {
  getBloodBanks,
  getBloodBankById,
  createBloodBank,
  updateBloodBank,
  deleteBloodBank,
} = require('../controllers/bloodBankController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public read of nearby banks (any authenticated user can read)
router.get('/', protect, getBloodBanks);
router.get('/:id', protect, getBloodBankById);

// Only Officers / Admins can modify blood banks
router.post('/', protect, authorize('BLOOD_BANK_OFFICER', 'ADMIN'), createBloodBank);
router.put('/:id', protect, authorize('BLOOD_BANK_OFFICER', 'ADMIN'), updateBloodBank);
router.delete('/:id', protect, authorize('BLOOD_BANK_OFFICER', 'ADMIN'), deleteBloodBank);

module.exports = router;