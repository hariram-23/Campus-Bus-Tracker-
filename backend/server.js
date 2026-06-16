require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Make io accessible in controllers
app.set('io', io);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/buses', require('./routes/buses'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/drivers', require('./routes/drivers'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
