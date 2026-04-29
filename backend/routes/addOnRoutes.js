const express = require('express');
const router = express.Router();
const { getAddOnItems, getMyTransactions, createTransaction } = require('../controllers/addOnController');
const { protect, userOnly } = require('../middleware/authMiddleware');

router.get('/items', protect, userOnly, getAddOnItems);
router.route('/')
  .get(protect, userOnly, getMyTransactions)
  .post(protect, userOnly, createTransaction);

module.exports = router;
