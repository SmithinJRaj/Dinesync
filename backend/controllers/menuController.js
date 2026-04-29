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
    const { messId, cycleId, itemId } = req.body;
    if (!messId || !cycleId || !itemId) {
      return res.status(400).json({ message: 'All fields (messId, cycleId, itemId) are required' });
    }
    const scheduleResult = await pool.query(
      `INSERT INTO "MenuSchedule" (mess_id, cycle_id, item_id) VALUES ($1, $2, $3) RETURNING *`,
      [parseInt(messId), parseInt(cycleId), parseInt(itemId)]
    );
    
    const itemResult = await pool.query(`SELECT * FROM "MenuItem" WHERE item_id = $1`, [parseInt(itemId)]);
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
    const studentId = req.user.id;
    let targetMessId = req.query.messId ? parseInt(req.query.messId) : null;
    
    // Attempt to resolve mess id if not explicitly passed
    if (!targetMessId) {
      const cycleRes = await pool.query(`
        SELECT cycle_id FROM "BillingCycle"
        WHERE CURRENT_DATE BETWEEN start_date AND end_date
        LIMIT 1
      `);
      if (cycleRes.rows.length > 0) {
          const registrationResult = await pool.query(`
            SELECT mess_id FROM "MessRegistration" 
            WHERE student_id = $1 AND cycle_id = $2
          `, [studentId, cycleRes.rows[0].cycle_id]);
          
          if (registrationResult.rows.length > 0) {
             targetMessId = registrationResult.rows[0].mess_id;
          }
      }

      if (!targetMessId) {
          const firstMessResult = await pool.query(`SELECT mess_id FROM "Mess" ORDER BY mess_id ASC LIMIT 1`);
          targetMessId = firstMessResult.rows[0]?.mess_id || 1;
      }
    }

    const rawMenuResult = await pool.query(`
      SELECT 
        mc.day_of_week, 
        mc.meal_session, 
        mi.item_id, 
        mi.name as "itemName", 
        mi.price as "itemPrice" 
      FROM "MenuSchedule" ms
      JOIN "MenuCycle" mc ON ms.cycle_id = mc.cycle_id
      JOIN "MenuItem" mi ON ms.item_id = mi.item_id
      WHERE ms.mess_id = $1
    `, [targetMessId]);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const sessions = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
    const groupedMenu = {};
    
    // Initialize structure
    days.forEach(d => {
        groupedMenu[d] = {};
        sessions.forEach(s => {
            groupedMenu[d][s] = [];
        });
    });

    rawMenuResult.rows.forEach(row => {
        if (groupedMenu[row.day_of_week] && groupedMenu[row.day_of_week][row.meal_session]) {
            groupedMenu[row.day_of_week][row.meal_session].push({
                meal_session: row.meal_session,
                item: {
                    id: row.item_id,
                    name: row.itemName,
                    price: row.itemPrice
                }
            });
        }
    });

    res.json({ schedule: groupedMenu, messId: targetMessId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching menu' });
  }
};

module.exports = { createMenuItem, createMenuSchedule, getMenu };
