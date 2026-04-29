const pool = require('../db');

// @desc    Submit a sign-off
// @route   POST /api/signoffs
// @access  User
const submitSignOff = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const cycleRes = await pool.query(`
        SELECT cycle_id FROM "BillingCycle"
        WHERE CURRENT_DATE BETWEEN start_date AND end_date
        LIMIT 1
    `);
    
    if (cycleRes.rows.length === 0) {
        return res.status(400).json({ message: 'No active billing cycle to verify registration.' });
    }

    const cycleId = cycleRes.rows[0].cycle_id;

    const regResult = await pool.query(`
        SELECT * FROM "MessRegistration" 
        WHERE student_id = $1 AND cycle_id = $2
    `, [studentId, cycleId]);
    
    const registration = regResult.rows[0];

    if (!registration) {
      return res.status(403).json({ message: 'User is not registered to any mess' });
    }

    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start <= today) {
        return res.status(400).json({ message: 'Start date must be after today' });
    }
    if (end < start) {
        return res.status(400).json({ message: 'End date cannot be before start date' });
    }

    const result = await pool.query(
      `INSERT INTO "SignOff" (student_id, start_date, end_date, status) VALUES ($1, $2, $3, 'APPROVED') RETURNING *`,
      [studentId, start, end]
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
    const studentId = req.user.id;

    const result = await pool.query(`SELECT * FROM "SignOff" WHERE student_id = $1 ORDER BY start_date DESC`, [studentId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching sign-offs' });
  }
};

module.exports = { submitSignOff, getSignOffs };
