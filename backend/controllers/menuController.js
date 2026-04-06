const pool = require('../db');

// @desc    Create menu item
// @route   POST /api/menu/items
// @access  Admin
const createMenuItem = async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || price == null) {
      return res.status(400).json({ message: 'Name and price are required' });
    }
    const result = await pool.query(
      `INSERT INTO "MenuItem" (name, price) VALUES ($1, $2) RETURNING *`,
      [name, parseFloat(price)]
    );
    res.status(201).json(result.rows[0]);
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
    const scheduleResult = await pool.query(
      `INSERT INTO "MenuSchedule" ("messId", day, "mealType", "itemId") VALUES ($1, $2, $3, $4) RETURNING *`,
      [parseInt(messId), day, mealType, parseInt(itemId)]
    );
    
    // Include the item data to match Prisma's "include: { item: true }" behavior
    const itemResult = await pool.query(`SELECT * FROM "MenuItem" WHERE id = $1`, [parseInt(itemId)]);
    const schedule = scheduleResult.rows[0];
    schedule.item = itemResult.rows[0];

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
    
    const registrationResult = await pool.query(`SELECT * FROM "MessRegistration" WHERE "userId" = $1`, [userId]);
    const registration = registrationResult.rows[0];

    if (!registration) {
       return res.status(403).json({ message: 'User is not registered to any mess' });
    }

    const rawMenuResult = await pool.query(`
      SELECT ms.*, mi.name as "itemName", mi.price as "itemPrice" 
      FROM "MenuSchedule" ms
      JOIN "MenuItem" mi ON ms."itemId" = mi.id
      WHERE ms."messId" = $1
    `, [registration.messId]);
    
    const rawMenu = rawMenuResult.rows.map(row => {
       // Format to match prisma struct
       return {
          id: row.id,
          messId: row.messId,
          day: row.day,
          mealType: row.mealType,
          itemId: row.itemId,
          item: {
             id: row.itemId,
             name: row.itemName,
             price: row.itemPrice
          }
       };
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
