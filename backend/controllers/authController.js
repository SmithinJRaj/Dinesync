const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Check if user exists
    const userExists = await pool.query(`SELECT id FROM "User" WHERE username = $1`, [username]);

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const insertResult = await pool.query(
      `INSERT INTO "User" (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role`,
      [username, hashedPassword, role || 'USER']
    );

    const user = insertResult.rows[0];

    if (user) {
      res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role,
        token: generateToken(user.id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check for user
    const result = await pool.query(`SELECT * FROM "User" WHERE username = $1`, [username]);
    const user = result.rows[0];

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        token: generateToken(user.id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get all users (for MVP admin dash)
// @route   GET /api/auth/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await pool.query(`SELECT id, username, role FROM "User"`);
    res.json(users.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

module.exports = {
  signup,
  login,
  getAllUsers,
};
