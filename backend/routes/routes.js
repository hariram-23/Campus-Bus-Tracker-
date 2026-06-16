const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getAllRoutes, getRouteById, createRoute, updateRoute, deleteRoute } = require('../controllers/routeController');

router.get('/', verifyToken, getAllRoutes);
router.get('/:id', verifyToken, getRouteById);
router.post('/', verifyToken, requireRole('admin'), createRoute);
router.put('/:id', verifyToken, requireRole('admin'), updateRoute);
router.delete('/:id', verifyToken, requireRole('admin'), deleteRoute);

module.exports = router;
