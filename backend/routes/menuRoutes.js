const express = require('express');
const router = express.Router();
const { createMenuItem, createMenuSchedule, getMenu } = require('../controllers/menuController');
const { protect, adminOnly, userOnly } = require('../middleware/authMiddleware');

router.post('/items', protect, adminOnly, createMenuItem);
router.post('/schedule', protect, adminOnly, createMenuSchedule);
router.get('/', protect, userOnly, getMenu);

module.exports = router;
