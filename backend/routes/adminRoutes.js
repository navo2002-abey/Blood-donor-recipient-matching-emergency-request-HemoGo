const express = require('express');
const { createUser, getReports, getStats, getUsers, updateUser } = require('../controllers/adminController');
const { authorize, protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('ADMIN'));

router.get('/stats', getStats);
router.get('/reports', getReports);
router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);

module.exports = router;
