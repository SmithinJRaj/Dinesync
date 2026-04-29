const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController');
const { protect, userOnly } = require('../middleware/authMiddleware');

router.get('/', protect, userOnly, getDashboardData);

module.exports = router;
