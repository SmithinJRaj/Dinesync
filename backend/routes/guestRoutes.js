const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, guestController.getGuestHistory);
router.post('/', protect, guestController.createGuestRequest);

module.exports = router;
