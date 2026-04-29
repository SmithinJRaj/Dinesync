const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { 
  getMesses, addMess, updateMess, deleteMess,
  getAdminMenu, setAdminMenu, getMenuCyclesItems, addMenuItem,
  getBillingCycles, addBillingCycle, simulateEndCycle, deleteBillingCycle,
  updateSignOff, updateGuestRequest, getAllRequests,
  getFeeMonitor,
  getUsersAdmin, toggleAccountStatus
} = require('../controllers/adminController');

// All rules strictly verified dynamically
router.use(protect);
router.use(adminOnly);

// 1. Mess Routes
router.route('/mess')
  .get(getMesses)
  .post(addMess);
router.route('/mess/:id')
  .put(updateMess)
  .delete(deleteMess);

// 2. Menu Routes
router.route('/menu')
  .get(getAdminMenu)
  .post(setAdminMenu);
router.get('/menu/context', getMenuCyclesItems);
router.post('/menu/item', addMenuItem);

// 3. Billing Routes
router.route('/billing')
  .get(getBillingCycles)
  .post(addBillingCycle);
router.delete('/billing/:id', deleteBillingCycle);
router.post('/billing/simulate', simulateEndCycle);

// 4. Request Routes
router.get('/requests', getAllRequests);
router.patch('/signoff/:id', updateSignOff);
router.patch('/guest/:id', updateGuestRequest);

// 5. Fee Monitor
router.get('/fees', getFeeMonitor);

// 6. User Management
router.route('/users')
  .get(getUsersAdmin);
router.patch('/users/:id/toggle', toggleAccountStatus);

module.exports = router;
