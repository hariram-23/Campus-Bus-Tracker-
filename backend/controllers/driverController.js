const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.getAllDrivers = async (req, res) => {
  try {
    const [drivers] = await db.query('SELECT id, name, phone, email, status, created_at FROM drivers');
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

exports.createDriver = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, password required.' });
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO drivers (name, phone, email, password) VALUES (?, ?, ?, ?)',
      [name, phone, email, hashed]
    );
    res.status(201).json({ message: 'Driver created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

exports.updateDriver = async (req, res) => {
  try {
    const { name, phone, email, status } = req.body;
    await db.query('UPDATE drivers SET name=?, phone=?, email=?, status=? WHERE id=?',
      [name, phone, email, status || 'active', req.params.id]);
    res.json({ message: 'Driver updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

exports.deleteDriver = async (req, res) => {
  try {
    await db.query('DELETE FROM drivers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Driver deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};
