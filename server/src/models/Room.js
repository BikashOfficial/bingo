const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  socketId: { type: String, required: true },
  playerName: { type: String, required: true },
  board: { type: [[Number]], required: true },
  markedCells: { type: [[Boolean]], default: () => Array.from({ length: 5 }, () => Array(5).fill(false)) },
  completedLines: { type: [Number], default: [] },
  score: { type: Number, default: 0 },
});

const roomSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true, index: true },
    players: { type: [playerSchema], default: [] },
    markedNumbers: { type: [Number], default: [] },
    gameState: {
      type: String,
      enum: ['waiting', 'playing', 'finished'],
      default: 'waiting',
    },
    winner: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// TTL: auto-delete rooms after 2 hours of inactivity
roomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7200 });

module.exports = mongoose.model('Room', roomSchema);
