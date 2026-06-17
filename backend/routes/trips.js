const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { startTrip, endTrip, updateLocation, getTripHistory, getETA, getAnalytics, getActiveTrip } = require('../controllers/tripController');

router.get('/active', verifyToken, requireRole('driver'), getActiveTrip);
router.post('/start', verifyToken, requireRole('driver'), startTrip);
router.post('/end', verifyToken, requireRole('driver'), endTrip);
router.post('/location', verifyToken, requireRole('driver'), updateLocation);
router.get('/history', verifyToken, getTripHistory);
router.get('/eta/:busId/:stopId', verifyToken, getETA);
router.get('/analytics', verifyToken, requireRole('admin'), getAnalytics);

module.exports = router;
