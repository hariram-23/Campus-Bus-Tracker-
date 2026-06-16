const db = require('../config/db');

exports.getAllRoutes = async (req, res) => {
  try {
    const [routes] = await db.query('SELECT * FROM routes');
    for (const route of routes) {
      const [stops] = await db.query(
        'SELECT * FROM stops WHERE route_id = ? ORDER BY stop_order',
        [route.id]
      );
      route.stops = stops;
    }
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

exports.getRouteById = async (req, res) => {
  try {
    const [routes] = await db.query('SELECT * FROM routes WHERE id = ?', [req.params.id]);
    if (!routes.length) return res.status(404).json({ message: 'Route not found.' });
    const [stops] = await db.query(
      'SELECT * FROM stops WHERE route_id = ? ORDER BY stop_order',
      [req.params.id]
    );
    routes[0].stops = stops;
    res.json(routes[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

exports.createRoute = async (req, res) => {
  try {
    const { route_name, start_point, end_point, stops } = req.body;
    const [result] = await db.query(
      'INSERT INTO routes (route_name, start_point, end_point) VALUES (?, ?, ?)',
      [route_name, start_point, end_point]
    );
    const routeId = result.insertId;
    if (stops && stops.length) {
      for (let i = 0; i < stops.length; i++) {
        const s = stops[i];
        await db.query(
          'INSERT INTO stops (route_id, stop_name, latitude, longitude, stop_order) VALUES (?, ?, ?, ?, ?)',
          [routeId, s.stop_name, s.latitude, s.longitude, i + 1]
        );
      }
    }
    res.status(201).json({ message: 'Route created.', id: routeId });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const { route_name, start_point, end_point, stops } = req.body;
    await db.query(
      'UPDATE routes SET route_name=?, start_point=?, end_point=? WHERE id=?',
      [route_name, start_point, end_point, req.params.id]
    );
    if (stops) {
      await db.query('DELETE FROM stops WHERE route_id = ?', [req.params.id]);
      for (let i = 0; i < stops.length; i++) {
        const s = stops[i];
        await db.query(
          'INSERT INTO stops (route_id, stop_name, latitude, longitude, stop_order) VALUES (?, ?, ?, ?, ?)',
          [req.params.id, s.stop_name, s.latitude, s.longitude, i + 1]
        );
      }
    }
    res.json({ message: 'Route updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    await db.query('DELETE FROM routes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Route deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};
