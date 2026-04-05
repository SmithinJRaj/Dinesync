const express = require('express');
const router = express.Router();
const { createMenuItem, createMenuSchedule, getMenu } = require('../controllers/menuController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/items', protect, adminOnly, createMenuItem);
router.post('/schedule', protect, adminOnly, createMenuSchedule);
router.get('/', protect, getMenu);

module.exports = router;
