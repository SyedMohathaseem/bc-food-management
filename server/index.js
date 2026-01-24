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

const path = require('path');

// ...

// Serve Static Files (Frontend)
app.use(express.static(path.join(__dirname, '../')));

// Basic Route (optional, but static handles index.html)
// app.get('/', ...); 

// Routes
app.use('/api/customers', require('./routes/customers'));
// ... (rest of API routes)

app.use('/api/health', ...);

// Catch-all handler for SPA (Must be last)
app.get('*', (req, res) => {
  // If API request 404s, don't serve HTML, send 404 JSON
  if (req.path.startsWith('/api/')) {
     return res.status(404).json({ message: 'API Route not found' });
  }
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Routes
app.use('/api/customers', require('./routes/customers'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/extras', require('./routes/extras'));
app.use('/api/advance', require('./routes/advance'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/auth', require('./routes/auth'));

// Health Check
app.get('/health', async (req, res) => {
  try {
    const db = require('./config/db');
    await db.query('SELECT 1');
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.status(500).json({ status: 'Error', database: 'Disconnected', error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
