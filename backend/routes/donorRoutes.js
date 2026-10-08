const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getDonorProfile, verifyQR, completeDonation, redeemReward, getRedemptions } = require('../controllers/donorController');

const router = express.Router();

router.get('/profile', protect, getDonorProfile);
router.post('/verify-qr', protect, authorize('BLOOD_BANK_OFFICER', 'ADMIN'), verifyQR);
router.post('/complete-donation', protect, authorize('BLOOD_BANK_OFFICER', 'ADMIN'), completeDonation);
router.post('/redeem', protect, authorize('DONOR'), redeemReward);
router.get('/redemptions', protect, authorize('DONOR'), getRedemptions);

module.exports = router;
