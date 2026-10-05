const express = require('express');
const {
  createUser,
  getReports,
  getStats,
  getUsers,
  updateUser,
  getAdminBloodRequests,
  updateAdminBloodRequest,
  assignDonorToBloodRequest,
  overrideBloodRequestStatus,
  deleteAdminBloodRequest,
} = require('../controllers/adminController');
const { authorize, protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('ADMIN'));

router.get('/stats', getStats);
router.get('/reports', getReports);
router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);

// Admin Blood Request Routes
router.get('/blood-requests', getAdminBloodRequests);
router.put('/blood-requests/:id', updateAdminBloodRequest);
router.post('/blood-requests/:id/assign-donor', assignDonorToBloodRequest);
router.post('/blood-requests/:id/override-status', overrideBloodRequestStatus);
router.delete('/blood-requests/:id', deleteAdminBloodRequest);

module.exports = router;
