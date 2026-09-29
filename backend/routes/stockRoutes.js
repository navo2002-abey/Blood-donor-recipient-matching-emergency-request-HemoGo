const express = require('express');
const {
  createStock,
  getStock,
  getStockById,
  updateStock,
  deleteStock,
  getExpiring,
  getAvailableBatches,
} = require('../controllers/stockController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All stock routes require auth + officer/admin role
router.use(protect, authorize('BLOOD_BANK_OFFICER', 'ADMIN'));

// Specific routes MUST come before /:id
router.get('/expiring', getExpiring);
router.get('/available-batches', getAvailableBatches);

// CRUD
router.route('/').get(getStock).post(createStock);
router.route('/:id').get(getStockById).put(updateStock).delete(deleteStock);

module.exports = router;