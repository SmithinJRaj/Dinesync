const express = require('express');
const router = express.Router();
const { createMess, registerMess, getMesses, getMyRegistration, resetMonthlyCycle } = require('../controllers/messController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/my-registration', protect, getMyRegistration);

router.delete('/reset-month', protect, resetMonthlyCycle);

router.route('/')
  .get(protect, getMesses)
  .post(protect, adminOnly, createMess);

router.post('/:messId/register', protect, registerMess);

module.exports = router;
