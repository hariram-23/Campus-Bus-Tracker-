const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getAllBuses, getBusById, createBus, updateBus, deleteBus,
  getBusLocation, getAllLiveLocations
} = require('../controllers/busController');

router.get('/', verifyToken, getAllBuses);
router.get('/live', verifyToken, getAllLiveLocations);
router.get('/:id', verifyToken, getBusById);
router.get('/:id/location', verifyToken, getBusLocation);
router.post('/', verifyToken, requireRole('admin'), createBus);
router.put('/:id', verifyToken, requireRole('admin'), updateBus);
router.delete('/:id', verifyToken, requireRole('admin'), deleteBus);

module.exports = router;
