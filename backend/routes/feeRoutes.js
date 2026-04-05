const express = require('express');
const router = express.Router();
const { calculateMyFee, generateFeeRecord, processPayment, getMyPayments } = require('../controllers/feeController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/my-fee', protect, calculateMyFee);
router.get('/payments', protect, getMyPayments);
router.post('/pay', protect, processPayment);
router.post('/generate/:userId', protect, adminOnly, generateFeeRecord);

module.exports = router;
