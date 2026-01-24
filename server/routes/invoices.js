const express = require('express');
const router = express.Router();
const db = require('../config/db');

// @route   GET /api/invoices
// @desc    Get all pending invoices (or filtered)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT i.*, c.name as customer_name, c.mobile as customer_mobile
      FROM invoices i 
      JOIN customers c ON i.customer_id = c.id
    `;
    const params = [];
    
    if (status && status !== 'all') {
      query += ' WHERE i.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY i.created_at DESC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/invoices
// @desc    Create a new invoice (Save as Pending)
router.post('/', async (req, res) => {
  const { customerId, month, year, amount } = req.body;
  const id = `inv_${Date.now()}`;
  
  if (!customerId || !month || !year || amount === undefined) {
    return res.status(400).json({ message: 'Please fill in all required fields' });
  }

  try {
    await db.query(
      'INSERT INTO invoices (id, customer_id, month, year, amount, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, customerId, month, year, amount, 'pending']
    );
    res.status(201).json({ id, message: 'Invoice saved as pending' });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/invoices/:id/pay
// @desc    Mark invoice as paid
router.put('/:id/pay', async (req, res) => {
  try {
    const { notes } = req.body;
    const paidAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db.query(
      'UPDATE invoices SET status = ?, paid_at = ?, payment_notes = ? WHERE id = ?',
      ['paid', paidAt, notes || '', req.params.id]
    );
    res.json({ message: 'Invoice marked as paid' });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
