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
    const userExists = await pool.query(`SELECT user_id FROM "Account" WHERE username = $1`, [username]);

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    // Create user in Account
    const insertResult = await pool.query(
      `INSERT INTO "Account" (username, password_hash, role, account_status) VALUES ($1, $2, $3, 'ACTIVE') RETURNING user_id, username, role`,
      [username, hashedPassword, userRole]
    );

    const user = insertResult.rows[0];

    // Insert into Student or Admin based on role
    if (userRole === 'ADMIN') {
        await pool.query(
            `INSERT INTO "Admin" (admin_id, name, email, phone_number) VALUES ($1, $2, $3, $4)`,
            [user.user_id, username, `${username}@dinesync.com`, '0000000000']
        );
    } else {
        await pool.query(
            `INSERT INTO "Student" (student_id, name, email, phone_number) VALUES ($1, $2, $3, $4)`,
            [user.user_id, username, `${username}@dinesync.com`, '0000000000']
        );
    }

    if (user) {
      res.status(201).json({
        id: user.user_id,
        username: user.username,
        role: user.role,
        token: generateToken(user.user_id, user.role),
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
    const result = await pool.query(`SELECT * FROM "Account" WHERE username = $1`, [username]);
    const user = result.rows[0];

    if (!user) {
        return res.status(401).json({ message: 'Invalid username' });
    }
    if (user.account_status !== 'ACTIVE') {
        return res.status(403).json({ message: 'Account is not active' });
    }

    if (await bcrypt.compare(password, user.password_hash)) {
      res.json({
        id: user.user_id,
        username: user.username,
        role: user.role,
        token: generateToken(user.user_id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid password' });
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
    const users = await pool.query(`SELECT user_id, username, role FROM "Account"`);
    res.json(users.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    const result = await pool.query(
      `SELECT a.username, a.account_status, a.role, s.name, s.email, s.phone_number 
       FROM "Account" a
       JOIN "Student" s ON a.user_id = s.student_id
       WHERE a.user_id = $1`, [studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
}

module.exports = {
  signup,
  login,
  getAllUsers,
  getProfile
};
