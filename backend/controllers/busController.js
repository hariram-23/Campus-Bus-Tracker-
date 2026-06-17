const db = require('../config/db');

// Get the bus assigned to the logged-in driver
exports.getMyBus = async (req, res) => {
  try {
    const [buses] = await db.query(`
      SELECT b.*, r.route_name, r.start_point, r.end_point
      FROM buses b
      LEFT JOIN routes r ON b.route_id = r.id
      WHERE b.driver_id = ?
      LIMIT 1
    `, [req.user.id]);
    res.json(buses[0] || null);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Get all buses with route and driver info
exports.getAllBuses = async (req, res) => {
  try {
    const [buses] = await db.query(`
      SELECT b.*, d.name AS driver_name, d.phone AS driver_phone,
             r.route_name, r.start_point, r.end_point
      FROM buses b
      LEFT JOIN drivers d ON b.driver_id = d.id
      LEFT JOIN routes r ON b.route_id = r.id
    `);
    res.json(buses);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Get single bus
exports.getBusById = async (req, res) => {
  try {
    const [buses] = await db.query(`
      SELECT b.*, d.name AS driver_name, d.phone AS driver_phone,
             r.route_name, r.start_point, r.end_point
      FROM buses b
      LEFT JOIN drivers d ON b.driver_id = d.id
      LEFT JOIN routes r ON b.route_id = r.id
      WHERE b.id = ?
    `, [req.params.id]);
    if (!buses.length) return res.status(404).json({ message: 'Bus not found.' });
    res.json(buses[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Create bus (admin)
exports.createBus = async (req, res) => {
  try {
    const { bus_number, driver_id, route_id, capacity } = req.body;
    if (!bus_number) return res.status(400).json({ message: 'Bus number is required.' });
    const [result] = await db.query(
      'INSERT INTO buses (bus_number, driver_id, route_id, capacity) VALUES (?, ?, ?, ?)',
      [bus_number, driver_id || null, route_id || null, capacity || 40]
    );
    res.status(201).json({ message: 'Bus created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Update bus (admin)
exports.updateBus = async (req, res) => {
  try {
    const { bus_number, driver_id, route_id, capacity, status } = req.body;

    // Check current bus status
    const [buses] = await db.query('SELECT status, driver_id, route_id FROM buses WHERE id = ?', [req.params.id]);
    if (!buses.length) return res.status(404).json({ message: 'Bus not found.' });

    const currentBus = buses[0];
    const isOnTrip = currentBus.status === 'on_trip';

    // If bus is on a trip, only allow bus_number and capacity to change
    const safeDriverId = isOnTrip ? currentBus.driver_id : (driver_id || null);
    const safeRouteId = isOnTrip ? currentBus.route_id : (route_id || null);

    await db.query(
      'UPDATE buses SET bus_number=?, driver_id=?, route_id=?, capacity=?, status=? WHERE id=?',
      [bus_number, safeDriverId, safeRouteId, capacity || 40, isOnTrip ? 'on_trip' : (status || 'active'), req.params.id]
    );
    res.json({ message: isOnTrip ? 'Bus updated (driver/route locked during active trip).' : 'Bus updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Delete bus (admin)
exports.deleteBus = async (req, res) => {
  try {
    await db.query('DELETE FROM buses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Bus deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Get live location of a bus
exports.getBusLocation = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM bus_locations WHERE bus_id = ? ORDER BY timestamp DESC LIMIT 1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'No location data.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Get all active bus locations
exports.getAllLiveLocations = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT bl.*, b.bus_number, b.status AS bus_status,
             r.route_name, d.name AS driver_name
      FROM bus_locations bl
      INNER JOIN (
        SELECT bus_id, MAX(timestamp) AS latest
        FROM bus_locations GROUP BY bus_id
      ) latest ON bl.bus_id = latest.bus_id AND bl.timestamp = latest.latest
      JOIN buses b ON bl.bus_id = b.id
      LEFT JOIN routes r ON b.route_id = r.id
      LEFT JOIN drivers d ON b.driver_id = d.id
      WHERE b.status = 'on_trip'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};
