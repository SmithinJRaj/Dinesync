const pool = require('../db');

exports.getAddOnItems = async (req, res) => {
  try {
    const result = await pool.query(`SELECT item_id, name, price FROM "MenuItem" ORDER BY name ASC`);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving add-on items' });
  }
};

exports.getMyTransactions = async (req, res) => {
  try {
    const studentId = req.user.id;
    const result = await pool.query(
      `SELECT a.transaction_id, a.quantity, a.purchase_date, a.item_id, m.name, m.price 
       FROM "AddOnTransaction" a 
       JOIN "MenuItem" m ON a.item_id = m.item_id 
       WHERE a.student_id = $1 ORDER BY a.purchase_date DESC`,
      [studentId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving transactions' });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { item_id, quantity } = req.body;

    if (!item_id || !quantity || parseInt(quantity) <= 0) {
      return res.status(400).json({ message: 'Item ID and a valid quantity greater than 0 are required' });
    }

    const itemRes = await pool.query(`SELECT item_id FROM "MenuItem" WHERE item_id = $1`, [parseInt(item_id)]);
    if (itemRes.rows.length === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const result = await pool.query(
      `INSERT INTO "AddOnTransaction" (student_id, item_id, quantity) VALUES ($1, $2, $3) RETURNING *`,
      [studentId, parseInt(item_id), parseInt(quantity)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating transaction' });
  }
};
