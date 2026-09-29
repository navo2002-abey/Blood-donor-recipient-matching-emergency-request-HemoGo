const express = require('express');
const {
  createStock, getStock, getStockById, updateStock, deleteStock, getExpiring,
} = require('../controllers/stockController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('BLOOD_BANK_OFFICER', 'ADMIN'));

router.get('/expiring', getExpiring);
router.route('/').get(getStock).post(createStock);
router.route('/:id').get(getStockById).put(updateStock).delete(deleteStock);

module.exports = router;