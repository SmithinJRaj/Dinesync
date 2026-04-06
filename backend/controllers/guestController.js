const pool = require('../db');

// Get history of guest requests for the logged-in user
exports.getGuestHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT * FROM "GuestRequest" WHERE "userId" = $1 ORDER BY date DESC`,
      [userId]
    );
    res.json(result.rows);
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

    const requestDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    requestDate.setHours(0, 0, 0, 0);

    if (requestDate <= today) {
      return res.status(400).json({ message: 'Guest service must be booked at least one day in advance' });
    }

    // Dynamic fee based on mock calculation or actual menu lookup
    // Assuming upfront payment logic handles the transfer, we just record it.
    const result = await pool.query(
      `INSERT INTO "GuestRequest" ("guestRollNo", date, "mealType", status, "userId") 
       VALUES ($1, $2, $3, 'CONFIRMED', $4) RETURNING *`,
      [guestRollNo, new Date(date), mealType, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error parsing request' });
  }
};
