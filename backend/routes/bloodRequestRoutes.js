const express = require('express');
const {
  createBloodRequest,
  getBloodRequests,
  getBloodRequestById,
  updateBloodRequest,
  deleteBloodRequest,
  acceptBloodRequest,
  verifyBloodRequest,
} = require('../controllers/bloodRequestController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const optionalProtect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return protect(req, res, next);
  }
  return next();
};

router.post('/', optionalProtect, createBloodRequest);
router.get('/', optionalProtect, getBloodRequests);
router.get('/:id', optionalProtect, getBloodRequestById);
router.put('/:id', optionalProtect, updateBloodRequest);
router.delete('/:id', optionalProtect, deleteBloodRequest);
router.post('/:id/accept', optionalProtect, acceptBloodRequest);
router.post('/:id/verify', optionalProtect, verifyBloodRequest);

module.exports = router;
