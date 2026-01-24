const express = require('express');
const router = express.Router();
const db = require('../config/db');

// @route   GET /api/advance
// @desc    Get all advance payments (optionally filtered by customer)
router.get('/', async (req, res) => {
  try {
    const { customerId, year } = req.query;
    let query = `
      SELECT ap.*, c.name as customer_name 
      FROM advance_payments ap 
      JOIN customers c ON ap.customer_id = c.id
    `;
    const params = [];
    const conditions = [];

    if (customerId) {
      conditions.push('ap.customer_id = ?');
      params.push(customerId);
    }
    
    if (year) {
      conditions.push('ap.year = ?');
      params.push(year);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY ap.date DESC, ap.created_at DESC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/advance
// @desc    Add a new advance payment
router.post('/', async (req, res) => {
  const { customerId, month, year, amount, date, notes } = req.body;
  const id = `adv_${Date.now()}`;
  
  if (!customerId || !month || !year || !amount || !date) {
    return res.status(400).json({ message: 'Please fill in all required fields' });
  }

  try {
    await db.query(
      'INSERT INTO advance_payments (id, customer_id, month, year, amount, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, customerId, month, year, amount, date, notes]
    );
    res.status(201).json({ id, customerId, month, year, amount, date, notes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/advance/:id
// @desc    Delete an advance payment
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM advance_payments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Payment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
