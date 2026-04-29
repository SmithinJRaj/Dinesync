const express = require('express');
const router = express.Router();
const { createMess, registerMess, getMesses, getMyRegistration, resetMonthlyCycle } = require('../controllers/messController');
const { protect, adminOnly, userOnly } = require('../middleware/authMiddleware');

router.get('/my-registration', protect, userOnly, getMyRegistration);

router.delete('/reset-month', protect, resetMonthlyCycle);

router.route('/')
  .get(protect, userOnly, getMesses)
  .post(protect, adminOnly, createMess);

router.post('/:messId/register', protect, userOnly, registerMess);

module.exports = router;
