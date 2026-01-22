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
  console.log('Health check requested...');
  try {
    const db = require('../config/db');
    console.log('DB Config loaded, querying...');
    await db.query('SELECT 1');
    console.log('DB Query successful');
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    console.error('Health Check Failure:', error);
    res.status(500).json({ status: 'Error', database: 'Disconnected', error: error.message });
  }
});

// Root Route
app.get('/api', (req, res) => {
  res.send('Inas Cafe API (Netlify Functions) is running...');
});

module.exports.handler = serverless(app);
