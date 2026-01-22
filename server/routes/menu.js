const express = require('express');
const router = express.Router();
const db = require('../config/db');

// @route   GET /api/menu
// @desc    Get all menu items
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM menu_items ORDER BY category, name ASC');
    const menuItems = rows.map(m => ({
      ...m,
      price: parseFloat(m.price),
      available: !!m.available
    }));
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/menu
// @desc    Add a menu item
router.post('/', async (req, res) => {
  const m = req.body;
  const id = m.id || `menu_${Date.now()}`;
  
  try {
    await db.query(
      'INSERT INTO menu_items (id, name, category, price, description, available) VALUES (?, ?, ?, ?, ?, ?)',
      [id, m.name, m.category, m.price, m.description || '', m.available !== false]
    );
    res.status(201).json({ id, ...m });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/menu/:id
// @desc    Update a menu item
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  
  try {
    let query = 'UPDATE menu_items SET ';
    const params = [];
    const fields = [];
    
    if (updates.name) { fields.push('name = ?'); params.push(updates.name); }
    if (updates.category) { fields.push('category = ?'); params.push(updates.category); }
    if (updates.price !== undefined) { fields.push('price = ?'); params.push(updates.price); }
    if (updates.description !== undefined) { fields.push('description = ?'); params.push(updates.description); }
    if (updates.available !== undefined) { fields.push('available = ?'); params.push(updates.available); }
    
    if (fields.length === 0) return res.json({ message: 'No updates provided' });
    
    query += fields.join(', ') + ' WHERE id = ?';
    params.push(id);
    
    await db.query(query, params);
    res.json({ id, ...updates });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/menu/:id
// @desc    Delete a menu item
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
