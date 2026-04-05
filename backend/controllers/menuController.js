const prisma = require('../prisma');

// @desc    Create menu item
// @route   POST /api/menu/items
// @access  Admin
const createMenuItem = async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || price == null) {
      return res.status(400).json({ message: 'Name and price are required' });
    }
    const item = await prisma.menuItem.create({
      data: { name, price: parseFloat(price) }
    });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating menu item' });
  }
};

// @desc    Create menu schedule
// @route   POST /api/menu/schedule
// @access  Admin
const createMenuSchedule = async (req, res) => {
  try {
    const { messId, day, mealType, itemId } = req.body;
    if (!messId || !day || !mealType || !itemId) {
      return res.status(400).json({ message: 'All fields (messId, day, mealType, itemId) are required' });
    }
    const schedule = await prisma.menuSchedule.create({
      data: { 
        messId: parseInt(messId), 
        day, 
        mealType, 
        itemId: parseInt(itemId) 
      },
      include: {
        item: true
      }
    });
    res.status(201).json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating schedule' });
  }
};

// @desc    Get menu grouped by days
// @route   GET /api/menu
// @access  User
const getMenu = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const registration = await prisma.messRegistration.findFirst({
       where: { userId }
    });

    if (!registration) {
       return res.status(403).json({ message: 'User is not registered to any mess' });
    }

    const rawMenu = await prisma.menuSchedule.findMany({
      where: { messId: registration.messId },
      include: { item: true }
    });

    const groupedMenu = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(d => groupedMenu[d] = []);

    rawMenu.forEach(entry => {
       if (!groupedMenu[entry.day]) groupedMenu[entry.day] = [];
       groupedMenu[entry.day].push(entry);
    });

    res.json(groupedMenu);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching menu' });
  }
};

module.exports = { createMenuItem, createMenuSchedule, getMenu };
