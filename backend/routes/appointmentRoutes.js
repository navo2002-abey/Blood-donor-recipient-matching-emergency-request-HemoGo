const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { createAppointment, getAppointmentHistory, deleteAppointment } = require('../controllers/appointmentController');

const router = express.Router();

router.post('/', protect, authorize('DONOR'), createAppointment);
router.get('/history', protect, authorize('DONOR'), getAppointmentHistory);
router.delete('/:id', protect, authorize('DONOR'), deleteAppointment);

module.exports = router;
