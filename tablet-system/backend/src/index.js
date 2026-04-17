require('dotenv').config();

const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const { Server } = require('socket.io');

const { router: rideRouter, setEmitter } = require('./routes/ride');
const bookingRouter = require('./routes/booking');

const app    = express();
const server = http.createServer(app);

// ─────────────────────────────────────────────
// SOCKET.IO
// Each ride gets its own room: `ride:<id>`
// The driver app joins the room and can send commands.
// The tablet joins the same room and receives events.
// ─────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  // Client (tablet or driver) joins a ride room
  socket.on('join:ride', (rideId) => {
    socket.join(`ride:${rideId}`);
    console.log(`[socket] ${socket.id} joined ride:${rideId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[socket] ${socket.id} disconnected`);
  });
});

// Emit helper — used by ride routes to push events to a ride room
function emitToRide(rideId, event, payload) {
  io.to(`ride:${rideId}`).emit(event, payload);
  console.log(`[socket] → ride:${rideId} | ${event}`, payload);
}

// Inject emitter into ride route module
setEmitter(emitToRide);

// ─────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));

// Raw body for Stripe webhook must come BEFORE express.json()
app.use('/booking/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────
app.use('/ride',    rideRouter);
app.use('/booking', bookingRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🚀 Synergy Lux backend running on port ${PORT}`);
  console.log(`   Socket.io ready`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
