const express = require('express');
const router = express.Router();
const db = require('../config/db');

// @route   GET /api/customers
// @desc    Get all customers
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM customers ORDER BY name ASC');
    // Parch JSON fields
    const customers = rows.map(c => ({
      ...c,
      mealTimes: typeof c.meal_times === 'string' ? JSON.parse(c.meal_times) : c.meal_times,
      subscriptionType: c.subscription_type,
      dailyAmount: parseFloat(c.daily_amount),
      advanceAmount: parseFloat(c.advance_amount),
      startDate: c.start_date
    }));
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// @route   GET /api/customers/:id
// @desc    Get single customer
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    const c = rows[0];
    const customer = {
      ...c,
      mealTimes: typeof c.meal_times === 'string' ? JSON.parse(c.meal_times) : c.meal_times,
      subscriptionType: c.subscription_type,
      dailyAmount: parseFloat(c.daily_amount),
      advanceAmount: parseFloat(c.advance_amount),
      startDate: c.start_date
    };
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/customers
// @desc    Add a new customer
router.post('/', async (req, res) => {
  const c = req.body;
  const id = c.id || `cust_${Date.now()}`;
  
  try {
    const mealTimes = JSON.stringify(c.mealTimes || []);
    await db.query(
      'INSERT INTO customers (id, name, mobile, address, subscription_type, daily_amount, meal_times, referral, start_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, c.name, c.mobile, c.address, c.subscriptionType, c.dailyAmount, mealTimes, c.referral, c.startDate, c.status || 'active']
    );
    res.status(201).json({ id, ...c });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/customers/:id
// @desc    Update a customer
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  
  try {
    // Dynamically build update query
    let query = 'UPDATE customers SET ';
    const params = [];
    const fields = [];
    
    if (updates.name) { fields.push('name = ?'); params.push(updates.name); }
    if (updates.mobile) { fields.push('mobile = ?'); params.push(updates.mobile); }
    if (updates.address) { fields.push('address = ?'); params.push(updates.address); }
    if (updates.subscriptionType) { fields.push('subscription_type = ?'); params.push(updates.subscriptionType); }
    if (updates.dailyAmount !== undefined) { fields.push('daily_amount = ?'); params.push(updates.dailyAmount); }
    if (updates.mealTimes) { fields.push('meal_times = ?'); params.push(JSON.stringify(updates.mealTimes)); }
    if (updates.mealTimes) { fields.push('meal_times = ?'); params.push(JSON.stringify(updates.mealTimes)); }
    if (updates.referral !== undefined) { fields.push('referral = ?'); params.push(updates.referral); }
    if (updates.startDate) { fields.push('start_date = ?'); params.push(updates.startDate); }
    if (updates.status) { fields.push('status = ?'); params.push(updates.status); }
    
    if (fields.length === 0) return res.json({ message: 'No updates provided' });
    
    query += fields.join(', ') + ' WHERE id = ?';
    params.push(id);
    
    await db.query(query, params);
    res.json({ id, ...updates });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete a customer
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
