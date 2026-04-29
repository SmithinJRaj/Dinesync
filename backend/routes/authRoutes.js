const express = require('express');
const router = express.Router();
const { signup, login, getAllUsers, getProfile } = require('../controllers/authController');
const { protect, adminOnly, userOnly } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/users', protect, adminOnly, getAllUsers);
router.get('/profile', protect, userOnly, getProfile);

module.exports = router;
