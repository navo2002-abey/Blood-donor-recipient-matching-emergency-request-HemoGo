const express = require('express');
const { getStats } = require('../controllers/adminController');
const { authorize, protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, authorize('ADMIN'), getStats);

module.exports = router;
