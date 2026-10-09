const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  updateAvailability,
  changePassword,
  forgotPassword,
  socialLogin,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/social', socialLogin);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.patch('/availability', protect, updateAvailability);
router.patch('/password', protect, changePassword);

module.exports = router;
