const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables (relevant for local netlify dev, ignored in prod)
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes (Relative to server/functions/)
app.use('/api/customers', require('../routes/customers'));
app.use('/api/menu', require('../routes/menu'));
app.use('/api/extras', require('../routes/extras'));
app.use('/api/auth', require('../routes/auth'));

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const db = require('../config/db');
    await db.query('SELECT 1');
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.status(500).json({ status: 'Error', database: 'Disconnected', error: error.message });
  }
});

// Root Route
app.get('/api', (req, res) => {
  res.send('Inas Cafe API (Netlify Functions) is running...');
});

module.exports.handler = serverless(app);
