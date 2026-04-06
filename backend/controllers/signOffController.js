const pool = require('../db');

// @desc    Submit a sign-off
// @route   POST /api/signoffs
// @access  User
const submitSignOff = async (req, res) => {
  try {
    const userId = req.user.id;
    const regResult = await pool.query(`SELECT * FROM "MessRegistration" WHERE "userId" = $1`, [userId]);
    const registration = regResult.rows[0];
    
    if (!registration) {
       return res.status(403).json({ message: 'User is not registered to any mess' });
    }

    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const result = await pool.query(
      `INSERT INTO "SignOff" ("userId", "startDate", "endDate") VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, new Date(startDate), new Date(endDate)]
    );

    res.status(201).json(result.rows[0]);
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
    const regResult = await pool.query(`SELECT * FROM "MessRegistration" WHERE "userId" = $1`, [userId]);
    const registration = regResult.rows[0];
    
    if (!registration) {
       return res.status(403).json({ message: 'User is not registered to any mess' });
    }

    const result = await pool.query(`SELECT * FROM "SignOff" WHERE "userId" = $1 ORDER BY "startDate" DESC`, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching sign-offs' });
  }
};

module.exports = { submitSignOff, getSignOffs };
