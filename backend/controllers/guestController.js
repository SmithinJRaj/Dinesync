const pool = require('../db');

// Get history of guest requests for the logged-in user
exports.getGuestHistory = async (req, res) => {
  try {
    const studentId = req.user.id;
    const result = await pool.query(
      `SELECT * FROM "GuestService" WHERE student_id = $1 ORDER BY request_date DESC`,
      [studentId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new guest request
exports.createGuestRequest = async (req, res) => {
  try {
    const { request_date, meal_session, mess_id } = req.body;
    const studentId = req.user.id;

    if (!request_date || !meal_session || !mess_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const requestDate = new Date(request_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    requestDate.setHours(0, 0, 0, 0);

    if (requestDate <= today) {
      return res.status(400).json({ message: 'Guest service must be booked at least one day in advance' });
    }

    const result = await pool.query(
      `INSERT INTO "GuestService" (student_id, mess_id, meal_session, request_date, status) 
       VALUES ($1, $2, $3, $4, 'APPROVED') RETURNING *`,
      [studentId, parseInt(mess_id), meal_session, new Date(request_date)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error parsing request' });
  }
};
