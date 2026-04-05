const express = require('express');
const router = express.Router();
const { signup, login, getAllUsers } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/users', protect, adminOnly, getAllUsers);

module.exports = router;
