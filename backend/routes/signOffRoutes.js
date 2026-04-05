const express = require('express');
const router = express.Router();
const { submitSignOff, getSignOffs } = require('../controllers/signOffController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, submitSignOff)
  .get(protect, getSignOffs);

module.exports = router;
