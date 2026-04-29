const express = require('express');
const router = express.Router();
const { getFeeRecord, processPayment } = require('../controllers/feeController');
const { protect, userOnly } = require('../middleware/authMiddleware');

router.get('/record', protect, userOnly, getFeeRecord);
router.post('/pay', protect, userOnly, processPayment);

module.exports = router;
