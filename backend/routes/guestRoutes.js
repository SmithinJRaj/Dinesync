const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const { protect, userOnly } = require('../middleware/authMiddleware');

router.get('/', protect, userOnly, guestController.getGuestHistory);
router.post('/', protect, userOnly, guestController.createGuestRequest);

module.exports = router;
