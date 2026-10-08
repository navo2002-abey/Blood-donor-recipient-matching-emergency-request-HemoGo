const express = require('express');
const {
  createRequestMatch,
  saveBestDonors,
  getMatchingDonors,
} = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const optionalProtect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return protect(req, res, next);
  }
  return next();
};

router.get('/donors/matching', optionalProtect, getMatchingDonors);
router.get('/matching-donors', optionalProtect, getMatchingDonors);
router.post('/request-matches', protect, createRequestMatch);
router.post('/best-donor-ai', protect, saveBestDonors);

module.exports = router;
