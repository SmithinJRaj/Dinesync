const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get history of guest requests for the logged-in user
exports.getGuestHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await prisma.guestRequest.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new guest request (and implicitly handle payment by adding to history)
exports.createGuestRequest = async (req, res) => {
  try {
    const { guestRollNo, date, mealType, messId } = req.body;
    const userId = req.user.id;

    if (!guestRollNo || !date || !mealType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Dynamic fee based on mock calculation or actual menu lookup
    // Assuming upfront payment logic handles the transfer, we just record it.
    const newRequest = await prisma.guestRequest.create({
      data: {
        guestRollNo,
        date: new Date(date),
        mealType,
        status: 'CONFIRMED', // Paid upfront as per UI
        userId
      }
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error parsing request' });
  }
};
