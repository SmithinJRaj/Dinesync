const pool = require('../db');

// @desc    Create a new mess
// @route   POST /api/mess
// @access  Admin
const createMess = async (req, res) => {
  try {
    const { name, capacity } = req.body;
    if (!name || capacity == null) {
      return res.status(400).json({ message: 'Name and capacity are required' });
    }
    const result = await pool.query(
      `INSERT INTO "Mess" (name, capacity) VALUES ($1, $2) RETURNING *`,
      [name, parseInt(capacity)]
    );
    res.status(201).json(result.rows[0]);
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
    const existingReq = await pool.query(`SELECT * FROM "MessRegistration" WHERE "userId" = $1`, [req.user.id]);
    if (existingReq.rows.length > 0) {
      return res.status(400).json({ message: 'User already registered to a mess' });
    }

    const registrationResult = await pool.query(
      `INSERT INTO "MessRegistration" ("userId", "messId") VALUES ($1, $2) RETURNING *`,
      [req.user.id, parseInt(messId)]
    );

    const messResult = await pool.query(`SELECT * FROM "Mess" WHERE id = $1`, [parseInt(messId)]);
    const registration = registrationResult.rows[0];
    registration.mess = messResult.rows[0];

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
    const result = await pool.query(`SELECT * FROM "Mess"`);
    res.json(result.rows);
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
    const regResult = await pool.query(`SELECT * FROM "MessRegistration" WHERE "userId" = $1`, [req.user.id]);
    const registration = regResult.rows[0];
    
    if (!registration) {
      return res.json({ registered: false });
    }

    const messResult = await pool.query(`SELECT * FROM "Mess" WHERE id = $1`, [registration.messId]);
    res.json({ registered: true, mess: messResult.rows[0] });
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
    await pool.query(`DELETE FROM "Payment" WHERE "userId" = $1`, [userId]);
    await pool.query(`DELETE FROM "SignOff" WHERE "userId" = $1`, [userId]);
    await pool.query(`DELETE FROM "MessRegistration" WHERE "userId" = $1`, [userId]);
    
    res.json({ message: 'Cycle cleanly reset' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error resetting cycle: ' + error.message });
  }
};

module.exports = { createMess, registerMess, getMesses, getMyRegistration, resetMonthlyCycle };
