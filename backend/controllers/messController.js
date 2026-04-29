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
      `INSERT INTO "Mess" (name, capacity, guest_capacity_per_session) VALUES ($1, $2, $3) RETURNING *`,
      [name, parseInt(capacity), Math.floor(parseInt(capacity) * 0.1)]
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
    const studentId = req.user.id;

    // Fetch ACTIVE BillingCycle
    const cycleRes = await pool.query(`
        SELECT cycle_id FROM "BillingCycle"
        WHERE CURRENT_DATE BETWEEN start_date AND end_date
        LIMIT 1
    `);
    if (cycleRes.rows.length === 0) {
        return res.status(400).json({ message: 'No active billing cycle found.' });
    }
    const cycleId = cycleRes.rows[0].cycle_id;
    
    // Check if user is already registered for this cycle
    const existingReq = await pool.query(`
        SELECT * FROM "MessRegistration" 
        WHERE student_id = $1 AND cycle_id = $2
    `, [studentId, cycleId]);
    
    if (existingReq.rows.length > 0) {
      return res.status(400).json({ message: 'User already registered for the current billing cycle.' });
    }

    const registrationResult = await pool.query(
      `INSERT INTO "MessRegistration" (student_id, mess_id, cycle_id) VALUES ($1, $2, $3) RETURNING *`,
      [studentId, parseInt(messId), cycleId]
    );

    const messResult = await pool.query(`SELECT * FROM "Mess" WHERE mess_id = $1`, [parseInt(messId)]);
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
    // Return all messes, format id to keep frontend simple if needed (but frontend handles generic or we can map mess_id to id)
    const result = await pool.query(`SELECT mess_id as id, name, location, capacity, guest_capacity_per_session FROM "Mess"`);
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
    const studentId = req.user.id;

    // Fetch ACTIVE BillingCycle
    const cycleRes = await pool.query(`
        SELECT cycle_id FROM "BillingCycle"
        WHERE CURRENT_DATE BETWEEN start_date AND end_date
        LIMIT 1
    `);
    
    if (cycleRes.rows.length === 0) {
        return res.json({ registered: false, message: 'No active cycle.' });
    }
    const cycleId = cycleRes.rows[0].cycle_id;

    const regResult = await pool.query(`
        SELECT * FROM "MessRegistration" 
        WHERE student_id = $1 AND cycle_id = $2
    `, [studentId, cycleId]);
    
    const registration = regResult.rows[0];
    
    if (!registration) {
      return res.json({ registered: false });
    }

    const messResult = await pool.query(`SELECT mess_id as id, name, location FROM "Mess" WHERE mess_id = $1`, [registration.mess_id]);
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
    const studentId = req.user.id;
    
    // For MVP testing reset.
    await pool.query(`DELETE FROM "Payment" WHERE student_id = $1`, [studentId]);
    await pool.query(`DELETE FROM "SignOff" WHERE student_id = $1`, [studentId]);
    await pool.query(`DELETE FROM "MessRegistration" WHERE student_id = $1`, [studentId]);
    
    res.json({ message: 'Cycle cleanly reset' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error resetting cycle: ' + error.message });
  }
};

module.exports = { createMess, registerMess, getMesses, getMyRegistration, resetMonthlyCycle };
