const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getAllDrivers, createDriver, updateDriver, deleteDriver } = require('../controllers/driverController');

router.get('/', verifyToken, requireRole('admin'), getAllDrivers);
router.post('/', verifyToken, requireRole('admin'), createDriver);
router.put('/:id', verifyToken, requireRole('admin'), updateDriver);
router.delete('/:id', verifyToken, requireRole('admin'), deleteDriver);

module.exports = router;
