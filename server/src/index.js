require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const { registerGameHandlers } = require('./sockets/gameSocket');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:4173'], credentials: true }));
app.use(express.json());

// ─── REST Routes ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.get('/api/rooms/:roomCode/exists', (req, res) => {
  const RoomStore = require('./services/roomStore');
  const code = req.params.roomCode.toUpperCase().trim();
  const room = RoomStore.get(code);
  if (!room) return res.json({ exists: false });
  res.json({ exists: true, playerCount: room.players.length, gameState: room.gameState });
});

// ─── Socket.IO ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);
  registerGameHandlers(io, socket);
});

// ─── MongoDB ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

function startServer() {
  server.listen(PORT, () => {
    console.log(`\n🎲 Bingo Server running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO ready`);
    console.log(`📦 Client URL: ${CLIENT_URL}\n`);
  });
}

if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log('✅ MongoDB connected');
      startServer();
    })
    .catch((err) => {
      console.warn('⚠️  MongoDB connection failed, running without DB:', err.message);
      startServer();
    });
} else {
  console.warn('⚠️  No MONGODB_URI set — running in-memory mode');
  startServer();
}
