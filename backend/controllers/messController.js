const prisma = require('../prisma');

// @desc    Create a new mess
// @route   POST /api/mess
// @access  Admin
const createMess = async (req, res) => {
  try {
    const { name, capacity } = req.body;
    if (!name || capacity == null) {
      return res.status(400).json({ message: 'Name and capacity are required' });
    }
    const mess = await prisma.mess.create({
      data: { name, capacity: parseInt(capacity) },
    });
    res.status(201).json(mess);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating mess' });
  }
};

// @desc    Register user to a mess
// @route   POST /api/mess/:messId/register
// @access  User
const registerMess = async (req, res) => {
  try {
    const { messId } = req.params;
    
    // Check if user is already registered to a mess
    const existingReq = await prisma.messRegistration.findFirst({
      where: { userId: req.user.id }
    });
    if (existingReq) {
      return res.status(400).json({ message: 'User already registered to a mess' });
    }

    const registration = await prisma.messRegistration.create({
      data: {
        userId: req.user.id,
        messId: parseInt(messId),
      },
      include: {
        mess: true
      }
    });
    res.status(201).json(registration);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering to mess: ' + error.message, stack: error.stack });
  }
};

// @desc    Get all messes
// @route   GET /api/mess
// @access  User
const getMesses = async (req, res) => {
  try {
    const messes = await prisma.mess.findMany();
    res.json(messes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching messes' });
  }
};

// @desc    Get user's registration status
// @route   GET /api/mess/my-registration
// @access  User
const getMyRegistration = async (req, res) => {
  try {
    const registration = await prisma.messRegistration.findFirst({
      where: { userId: req.user.id },
      include: { mess: true }
    });
    
    if (!registration) {
      return res.json({ registered: false });
    }

    res.json({ registered: true, mess: registration.mess });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching registration: ' + error.message });
  }
};

// @desc    Simulate End of Month / System Reset
// @route   DELETE /api/mess/reset-month
// @access  User
const resetMonthlyCycle = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Purge user's payments & sign-offs & reg to cleanly fake "Next Month"
    await prisma.payment.deleteMany({ where: { userId } });
    await prisma.signOff.deleteMany({ where: { userId } });
    await prisma.messRegistration.deleteMany({ where: { userId } });
    
    res.json({ message: 'Cycle cleanly reset' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error resetting cycle: ' + error.message });
  }
};

module.exports = { createMess, registerMess, getMesses, getMyRegistration, resetMonthlyCycle };
