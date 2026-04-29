const jwt = require('jsonwebtoken');
const pool = require('../db');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const result = await pool.query(`SELECT user_id as id, username, role, account_status FROM "Account" WHERE user_id = $1`, [decoded.id]);
      const user = result.rows[0];

      if (!user) {
         return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      if (user.account_status !== 'ACTIVE') {
         return res.status(403).json({ message: 'Not authorized, account inactive' });
      }

      // Add user info to request
      req.user = user;

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

const userOnly = (req, res, next) => {
  if (req.user && req.user.role === 'USER') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized. Routine solely mapped to standard users.' });
  }
};

module.exports = { protect, adminOnly, userOnly };
