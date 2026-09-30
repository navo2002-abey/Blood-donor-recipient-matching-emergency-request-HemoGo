const express = require('express');
const {
  createTransfer, getTransfers, updateTransfer, deleteTransfer,
} = require('../controllers/transferController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, authorize('BLOOD_BANK_OFFICER', 'ADMIN'));

router.route('/').get(getTransfers).post(createTransfer);
router.route('/:id').put(updateTransfer).delete(deleteTransfer);

module.exports = router;