const express = require('express');
const { createRequestMatch, saveBestDonors } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/request-matches', protect, createRequestMatch);
router.post('/best-donor-ai', protect, saveBestDonors);

module.exports = router;
