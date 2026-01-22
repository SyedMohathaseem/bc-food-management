const express = require('express');
const router = express.Router();
const db = require('../config/db');

// @route   GET /api/extras
// @desc    Get all daily extras
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM daily_extras ORDER BY date DESC, created_at DESC');
    const extras = rows.map(e => ({
      id: e.id,
      customerId: e.customer_id,
      menuItemId: e.menu_item_id,
      mealType: e.meal_type,
      price: parseFloat(e.price),
      notes: e.notes,
      date: e.date,
      createdAt: e.created_at
    }));
    res.json(extras);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/extras/date/:date
// @desc    Get extras for a specific date
router.get('/date/:date', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM daily_extras WHERE date = ?', [req.params.date]);
    res.json(rows.map(e => ({
      id: e.id,
      customerId: e.customer_id,
      menuItemId: e.menu_item_id,
      mealType: e.meal_type,
      price: parseFloat(e.price),
      notes: e.notes,
      date: e.date,
      createdAt: e.created_at
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/extras
// @desc    Add a daily extra
router.post('/', async (req, res) => {
  const e = req.body;
  const id = e.id || `extr_${Date.now()}`;
  
  try {
    await db.query(
      'INSERT INTO daily_extras (id, customer_id, menu_item_id, meal_type, price, notes, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, e.customerId, e.menuItemId, e.mealType, e.price, e.notes || '', e.date]
    );
    res.status(201).json({ id, ...e });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/extras/:id
// @desc    Delete an extra entry
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM daily_extras WHERE id = ?', [req.params.id]);
    res.json({ message: 'Extra deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/extras/details
// @desc    Delete extra by customer, date, and mealType (used for syncing/replacing)
router.post('/delete-by-details', async (req, res) => {
  const { customerId, date, mealType } = req.body;
  try {
    let query = 'DELETE FROM daily_extras WHERE customer_id = ? AND date = ?';
    const params = [customerId, date];
    
    if (mealType) {
      query += ' AND meal_type = ?';
      params.push(mealType);
    }
    
    await db.query(query, params);
    res.json({ message: 'Matching extras deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
