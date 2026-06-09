/**
 * In-memory room store — fallback when MongoDB is unavailable.
 * Also used as the primary fast-access cache for active rooms.
 */
const rooms = new Map();

const RoomStore = {
  get: (code) => rooms.get(code) || null,
  set: (code, room) => rooms.set(code, room),
  delete: (code) => rooms.delete(code),
  has: (code) => rooms.has(code),
  getAll: () => [...rooms.values()],
  /** Find a room by a player's socketId */
  findBySocket: (socketId) => {
    for (const room of rooms.values()) {
      if (room.players.some((p) => p.socketId === socketId)) return room;
    }
    return null;
  },
};

module.exports = RoomStore;
