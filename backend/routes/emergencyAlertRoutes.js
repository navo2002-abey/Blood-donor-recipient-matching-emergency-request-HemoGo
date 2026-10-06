const express = require('express');
const {
  dispatchAlert,
  getPendingAlertsForUser,
  dismissAlert,
  acceptAlert,
} = require('../controllers/emergencyAlertController');

const router = express.Router();

router.post('/dispatch', dispatchAlert);
router.get('/pending', getPendingAlertsForUser);
router.post('/:id/dismiss', dismissAlert);
router.post('/:id/accept', acceptAlert);

module.exports = router;
