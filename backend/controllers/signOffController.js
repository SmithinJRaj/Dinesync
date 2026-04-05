const prisma = require('../prisma');

// @desc    Submit a sign-off
// @route   POST /api/signoffs
// @access  User
const submitSignOff = async (req, res) => {
  try {
    const userId = req.user.id;
    const registration = await prisma.messRegistration.findFirst({
       where: { userId }
    });
    
    if (!registration) {
       return res.status(403).json({ message: 'User is not registered to any mess' });
    }

    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const signOff = await prisma.signOff.create({
      data: {
        userId: req.user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }
    });

    res.status(201).json(signOff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting sign-off' });
  }
};

// @desc    Get user sign-offs
// @route   GET /api/signoffs
// @access  User
const getSignOffs = async (req, res) => {
  try {
    const userId = req.user.id;
    const registration = await prisma.messRegistration.findFirst({
       where: { userId }
    });
    
    if (!registration) {
       return res.status(403).json({ message: 'User is not registered to any mess' });
    }

    const signOffs = await prisma.signOff.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' }
    });
    res.json(signOffs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching sign-offs' });
  }
};

module.exports = { submitSignOff, getSignOffs };
