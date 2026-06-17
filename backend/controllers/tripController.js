const db = require('../config/db');

// Get driver's active trip (for re-login restore)
exports.getActiveTrip = async (req, res) => {
  try {
    const driverId = req.user.id;
    const [trips] = await db.query(
      `SELECT t.*, b.bus_number, r.route_name
       FROM trips t
       JOIN buses b ON t.bus_id = b.id
       JOIN routes r ON t.route_id = r.id
       WHERE t.driver_id = ? AND t.status = 'active'
       LIMIT 1`,
      [driverId]
    );
    res.json(trips[0] || null);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Driver starts a trip
exports.startTrip = async (req, res) => {
  try {
    const driverId = req.user.id;
    // Find bus assigned to this driver
    const [buses] = await db.query('SELECT * FROM buses WHERE driver_id = ?', [driverId]);
    if (!buses.length) return res.status(404).json({ message: 'No bus assigned to you.' });
    const bus = buses[0];

    // Check if there's already an active trip
    const [active] = await db.query(
      "SELECT * FROM trips WHERE bus_id = ? AND status = 'active'", [bus.id]
    );
    if (active.length) return res.status(409).json({ message: 'Trip already active.', trip: active[0] });

    const [result] = await db.query(
      "INSERT INTO trips (bus_id, route_id, driver_id, start_time, status) VALUES (?, ?, ?, NOW(), 'active')",
      [bus.id, bus.route_id, driverId]
    );
    await db.query("UPDATE buses SET status = 'on_trip' WHERE id = ?", [bus.id]);
    res.status(201).json({ message: 'Trip started.', trip_id: result.insertId, bus_id: bus.id });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Driver ends a trip
exports.endTrip = async (req, res) => {
  try {
    const driverId = req.user.id;
    const [trips] = await db.query(
      "SELECT * FROM trips WHERE driver_id = ? AND status = 'active'", [driverId]
    );
    if (!trips.length) return res.status(404).json({ message: 'No active trip found.' });
    const trip = trips[0];

    // Calculate distance from location history
    const [locs] = await db.query(
      'SELECT latitude, longitude FROM bus_locations WHERE trip_id = ? ORDER BY timestamp',
      [trip.id]
    );
    let distance = 0;
    for (let i = 1; i < locs.length; i++) {
      distance += haversine(locs[i - 1].latitude, locs[i - 1].longitude, locs[i].latitude, locs[i].longitude);
    }

    await db.query(
      "UPDATE trips SET end_time = NOW(), status = 'completed', distance = ? WHERE id = ?",
      [distance.toFixed(2), trip.id]
    );
    await db.query("UPDATE buses SET status = 'active' WHERE id = ?", [trip.bus_id]);
    res.json({ message: 'Trip ended.', distance: distance.toFixed(2) });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Update GPS location (driver)
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, speed } = req.body;
    const driverId = req.user.id;

    const [trips] = await db.query(
      "SELECT * FROM trips WHERE driver_id = ? AND status = 'active'", [driverId]
    );
    if (!trips.length) return res.status(404).json({ message: 'No active trip.' });

    const [buses] = await db.query('SELECT id FROM buses WHERE driver_id = ?', [driverId]);
    if (!buses.length) return res.status(404).json({ message: 'No bus assigned.' });

    await db.query(
      'INSERT INTO bus_locations (bus_id, trip_id, latitude, longitude, speed) VALUES (?, ?, ?, ?, ?)',
      [buses[0].id, trips[0].id, latitude, longitude, speed || 0]
    );

    // Emit via socket (handled in server.js)
    req.app.get('io').emit('locationUpdate', {
      bus_id: buses[0].id,
      latitude, longitude, speed,
      timestamp: new Date()
    });

    res.json({ message: 'Location updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Get trip history
exports.getTripHistory = async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? `SELECT t.*, b.bus_number, r.route_name, d.name AS driver_name
         FROM trips t JOIN buses b ON t.bus_id = b.id
         JOIN routes r ON t.route_id = r.id
         JOIN drivers d ON t.driver_id = d.id
         ORDER BY t.created_at DESC LIMIT 50`
      : `SELECT t.*, b.bus_number, r.route_name, d.name AS driver_name
         FROM trips t JOIN buses b ON t.bus_id = b.id
         JOIN routes r ON t.route_id = r.id
         JOIN drivers d ON t.driver_id = d.id
         WHERE t.driver_id = ?
         ORDER BY t.created_at DESC LIMIT 20`;

    const params = req.user.role === 'admin' ? [] : [req.user.id];
    const [trips] = await db.query(query, params);
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ETA prediction using historical data
exports.getETA = async (req, res) => {
  try {
    const { busId, stopId } = req.params;

    // Get current bus location
    const [locs] = await db.query(
      'SELECT * FROM bus_locations WHERE bus_id = ? ORDER BY timestamp DESC LIMIT 1',
      [busId]
    );
    if (!locs.length) return res.json({ eta: null, message: 'Bus not active.' });

    // Get stop coordinates
    const [stops] = await db.query('SELECT * FROM stops WHERE id = ?', [stopId]);
    if (!stops.length) return res.status(404).json({ message: 'Stop not found.' });

    const dist = haversine(locs[0].latitude, locs[0].longitude, stops[0].latitude, stops[0].longitude);

    // Get average speed from historical trips (AI-lite)
    const [avgData] = await db.query(`
      SELECT AVG(bl.speed) AS avg_speed
      FROM bus_locations bl
      JOIN trips t ON bl.trip_id = t.id
      WHERE t.bus_id = ? AND t.status = 'completed' AND bl.speed > 0
    `, [busId]);

    const avgSpeed = (avgData[0].avg_speed && avgData[0].avg_speed > 0) ? avgData[0].avg_speed : 20; // default 20 km/h
    const etaMinutes = Math.round((dist / avgSpeed) * 60);

    // Check delay from recent trips
    const [recentTrips] = await db.query(`
      SELECT start_time, end_time, distance
      FROM trips WHERE bus_id = ? AND status = 'completed'
      ORDER BY end_time DESC LIMIT 5
    `, [busId]);

    let delayInfo = null;
    if (recentTrips.length >= 2) {
      const durations = recentTrips.map(t => {
        const diff = new Date(t.end_time) - new Date(t.start_time);
        return diff / 60000; // minutes
      });
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const latest = durations[0];
      if (latest > avgDuration * 1.2) {
        delayInfo = `Bus running ~${Math.round(latest - avgDuration)} min late based on recent trips`;
      }
    }

    res.json({
      eta_minutes: etaMinutes,
      distance_km: dist.toFixed(2),
      avg_speed_kmh: avgSpeed.toFixed(1),
      delay_info: delayInfo,
      status: delayInfo ? 'Delayed' : 'On Time'
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Analytics for admin
exports.getAnalytics = async (req, res) => {
  try {
    const [[{ totalBuses }]] = await db.query('SELECT COUNT(*) AS totalBuses FROM buses');
    const [[{ activeBuses }]] = await db.query("SELECT COUNT(*) AS activeBuses FROM buses WHERE status = 'on_trip'");
    const [[{ totalTrips }]] = await db.query('SELECT COUNT(*) AS totalTrips FROM trips');
    const [[{ totalStudents }]] = await db.query('SELECT COUNT(*) AS totalStudents FROM students');
    const [[{ totalDrivers }]] = await db.query('SELECT COUNT(*) AS totalDrivers FROM drivers');
    const [[{ totalRoutes }]] = await db.query('SELECT COUNT(*) AS totalRoutes FROM routes');
    const [recentTrips] = await db.query(`
      SELECT t.*, b.bus_number, r.route_name
      FROM trips t JOIN buses b ON t.bus_id = b.id JOIN routes r ON t.route_id = r.id
      ORDER BY t.created_at DESC LIMIT 5
    `);
    res.json({ totalBuses, activeBuses, totalTrips, totalStudents, totalDrivers, totalRoutes, recentTrips });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Haversine distance formula (km)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function deg2rad(deg) { return deg * (Math.PI / 180); }
