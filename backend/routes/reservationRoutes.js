const express = require('express');
const {
  createReservation, getReservations, updateReservation, deleteReservation,
} = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, authorize('BLOOD_BANK_OFFICER', 'ADMIN'));

router.route('/').get(getReservations).post(createReservation);
router.route('/:id').put(updateReservation).delete(deleteReservation);

module.exports = router;