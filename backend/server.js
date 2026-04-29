const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const messRoutes = require('./routes/messRoutes');
const menuRoutes = require('./routes/menuRoutes');
const signOffRoutes = require('./routes/signOffRoutes');
const feeRoutes = require('./routes/feeRoutes');
const guestRoutes = require('./routes/guestRoutes');
const addOnRoutes = require('./routes/addOnRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/signoffs', signOffRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/addons', addOnRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'DineSync API is running successfully.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});