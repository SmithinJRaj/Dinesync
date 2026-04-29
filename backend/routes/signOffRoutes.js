const express = require('express');
const router = express.Router();
const { submitSignOff, getSignOffs } = require('../controllers/signOffController');
const { protect, userOnly } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, userOnly, submitSignOff)
  .get(protect, userOnly, getSignOffs);

module.exports = router;
