const express = require('express');
const router = express.Router();
const db = require('../config/db');

// @route   POST /api/auth/login
// @desc    Login admin
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Check for existing user
    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const admin = rows[0];

    // Validate password (plain text as per user request/current setup)
    // Ideally this should use bcrypt.compare(password, admin.password)
    // But user stated "PASSWORD AS admin@2026" implying direct storage match for now.
    // We will do a direct comparison.
    if (password !== admin.password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Return success (can add JWT later if needed, keeping it simple for now as per minimal changes)
    res.json({
      success: true,
      message: 'Welcome back!',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update admin profile (email or password)
router.put('/profile', async (req, res) => {
  const { currentPassword, newEmail, newPassword, id } = req.body;

  if (!currentPassword) {
    return res.status(400).json({ message: 'Current password is required' });
  }

  try {
    // Get admin
    const [rows] = await db.query('SELECT * FROM admins WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const admin = rows[0];

    // Verify current password (plain text for now)
    if (currentPassword !== admin.password) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update Email
    if (newEmail) {
      // Check if email already exists
      const [existing] = await db.query('SELECT * FROM admins WHERE email = ? AND id != ?', [newEmail, id]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      await db.query('UPDATE admins SET email = ? WHERE id = ?', [newEmail, id]);
      return res.json({ success: true, message: 'Email updated successfully' });
    }

    // Update Password
    if (newPassword) {
      await db.query('UPDATE admins SET password = ? WHERE id = ?', [newPassword, id]);
      return res.json({ success: true, message: 'Password updated successfully' });
    }

    res.status(400).json({ message: 'No changes provided' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
