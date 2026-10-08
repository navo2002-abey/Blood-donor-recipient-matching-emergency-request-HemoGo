const express = require('express');
const { createRequestSummary } = require('../controllers/requestSummaryController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createRequestSummary);

module.exports = router;
