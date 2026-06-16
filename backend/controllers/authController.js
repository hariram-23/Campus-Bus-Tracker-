const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Student Register
exports.studentRegister = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required.' });

    const [existing] = await db.query('SELECT id FROM students WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO students (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, email, phone || null, hashed]
    );
    const token = generateToken({ id: result.insertId, role: 'student', name, email });
    res.status(201).json({ message: 'Registered successfully.', token, user: { id: result.insertId, name, email, role: 'student' } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Student Login
exports.studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM students WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials.' });
    const student = rows[0];
    const valid = await bcrypt.compare(password, student.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });
    const token = generateToken({ id: student.id, role: 'student', name: student.name, email: student.email });
    res.json({ token, user: { id: student.id, name: student.name, email: student.email, role: 'student' } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Driver Login
exports.driverLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM drivers WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials.' });
    const driver = rows[0];
    const valid = await bcrypt.compare(password, driver.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });
    const token = generateToken({ id: driver.id, role: 'driver', name: driver.name, email: driver.email });
    res.json({ token, user: { id: driver.id, name: driver.name, email: driver.email, role: 'driver' } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials.' });
    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });
    const token = generateToken({ id: admin.id, role: 'admin', name: admin.username, email: admin.email });
    res.json({ token, user: { id: admin.id, name: admin.username, email: admin.email, role: 'admin' } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};
