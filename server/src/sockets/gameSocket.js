const { generateRoomCode } = require('../utils/roomCode');
const { generateBoard, getCompletedLines, checkWin, findNumberPosition } = require('../services/boardService');
const RoomStore = require('../services/roomStore');

/**
 * All Socket.IO game event handlers.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function registerGameHandlers(io, socket) {
  // ─── CREATE ROOM ────────────────────────────────────────────────────────────
  socket.on('create_room', ({ playerName }) => {
    try {
      let roomCode;
      do {
        roomCode = generateRoomCode();
      } while (RoomStore.has(roomCode));

      const board = generateBoard();
      const player = {
        socketId: socket.id,
        playerName: playerName || 'Player 1',
        board,
        markedCells: Array.from({ length: 5 }, () => Array(5).fill(false)),
        completedLines: [],
        score: 0,
      };

      const room = {
        roomCode,
        players: [player],
        markedNumbers: [],
        gameState: 'waiting',
        winner: null,
        currentTurn: null, // set when 2nd player joins
        createdAt: Date.now(),
      };

      RoomStore.set(roomCode, room);
      socket.join(roomCode);

      socket.emit('room_created', {
        roomCode,
        player: { socketId: socket.id, playerName: player.playerName, board },
      });

      console.log(`[Room Created] ${roomCode} by ${player.playerName}`);
    } catch (err) {
      socket.emit('error', { message: 'Failed to create room.' });
      console.error('[create_room error]', err);
    }
  });

  // ─── JOIN ROOM ───────────────────────────────────────────────────────────────
  socket.on('join_room', ({ roomCode, playerName }) => {
    try {
      const code = (roomCode || '').toUpperCase().trim();
      const room = RoomStore.get(code);

      if (!room) {
        socket.emit('room_error', { type: 'not_found', message: 'Invalid room code.' });
        return;
      }

      // Check if same player is rejoining (reconnect)
      const existingIdx = room.players.findIndex((p) => p.playerName === playerName);
      if (existingIdx !== -1) {
        if (room.players[existingIdx].socketId !== socket.id) {
          room.players[existingIdx].socketId = socket.id;
          socket.join(code);
          io.to(code).emit('player_reconnected', { playerName });
        }
        socket.emit('room_rejoined', {
          roomCode: code,
          player: room.players[existingIdx],
          opponent: room.players.find((_, i) => i !== existingIdx) || null,
          markedNumbers: room.markedNumbers,
          gameState: room.gameState,
          currentTurn: room.currentTurn,
        });
        return;
      }

      if (room.gameState === 'finished') {
        socket.emit('room_error', { type: 'finished', message: 'This game has already ended.' });
        return;
      }

      if (room.players.length >= 2) {
        socket.emit('room_error', { type: 'full', message: 'Room is full.' });
        return;
      }

      const board = generateBoard();
      const player = {
        socketId: socket.id,
        playerName: playerName || 'Player 2',
        board,
        markedCells: Array.from({ length: 5 }, () => Array(5).fill(false)),
        completedLines: [],
        score: 0,
      };

      room.players.push(player);
      room.gameState = 'playing';
      // First turn goes to the room creator (player index 0)
      room.currentTurn = room.players[0].socketId;
      RoomStore.set(code, room);
      socket.join(code);

      // Tell the new player their info
      socket.emit('room_joined', {
        roomCode: code,
        player: { socketId: socket.id, playerName: player.playerName, board },
        opponent: {
          socketId: room.players[0].socketId,
          playerName: room.players[0].playerName,
          score: room.players[0].score,
        },
        markedNumbers: room.markedNumbers,
        currentTurn: room.currentTurn,
      });

      // Tell the room creator their opponent arrived and game starts
      io.to(code).emit('game_started', {
        players: room.players.map((p) => ({
          socketId: p.socketId,
          playerName: p.playerName,
          score: p.score,
        })),
        currentTurn: room.currentTurn,
      });

      // Send each player their own board privately
      for (const p of room.players) {
        io.to(p.socketId).emit('your_board', {
          board: p.board,
          markedCells: p.markedCells,
          completedLines: p.completedLines,
        });
      }

      console.log(`[Room Joined] ${code} — ${player.playerName} joined. Turn: ${room.players[0].playerName}`);
    } catch (err) {
      socket.emit('error', { message: 'Failed to join room.' });
      console.error('[join_room error]', err);
    }
  });

  // ─── MARK NUMBER ────────────────────────────────────────────────────────────
  socket.on('mark_number', ({ roomCode, number }) => {
    try {
      const room = RoomStore.get(roomCode);
      if (!room || room.gameState !== 'playing') return;

      // ── TURN CHECK: only the current turn player can mark ──
      if (room.currentTurn !== socket.id) {
        socket.emit('not_your_turn', { message: "It's not your turn!" });
        return;
      }

      // Prevent duplicate marks
      if (room.markedNumbers.includes(number)) return;
      room.markedNumbers.push(number);

      let newWinner = null;

      // Update both players' boards
      for (const player of room.players) {
        const pos = findNumberPosition(player.board, number);
        if (pos) {
          const [r, c] = pos;
          player.markedCells[r][c] = true;
        }

        const prevCount = player.completedLines.length;
        player.completedLines = getCompletedLines(player.markedCells);
        const newLines = player.completedLines.slice(prevCount);

        if (newLines.length > 0) {
          io.to(player.socketId).emit('line_completed', {
            completedLines: player.completedLines,
            newLines,
          });
        }

        if (checkWin(player.completedLines) && !newWinner) {
          newWinner = player.playerName;
        }
      }

      // Switch turns to the OTHER player
      const otherPlayer = room.players.find((p) => p.socketId !== socket.id);
      if (otherPlayer && !newWinner) {
        room.currentTurn = otherPlayer.socketId;
      }

      // Broadcast the marked number + new turn info to all in room
      io.to(roomCode).emit('number_marked', {
        number,
        markedBy: socket.id,
        markedNumbers: room.markedNumbers,
        currentTurn: room.currentTurn,
      });

      // Send updated board state privately to each player
      for (const p of room.players) {
        io.to(p.socketId).emit('board_updated', {
          markedCells: p.markedCells,
          completedLines: p.completedLines,
        });
      }

      // Handle win
      if (newWinner) {
        room.gameState = 'finished';
        room.winner = newWinner;
        room.currentTurn = null;

        const winner = room.players.find((p) => p.playerName === newWinner);
        if (winner) winner.score += 1;

        io.to(roomCode).emit('bingo_won', {
          winner: newWinner,
          scores: room.players.map((p) => ({ playerName: p.playerName, score: p.score })),
        });
        console.log(`[BINGO] ${newWinner} won in room ${roomCode}`);
      }

      RoomStore.set(roomCode, room);
    } catch (err) {
      console.error('[mark_number error]', err);
    }
  });

  // ─── SEND CHAT ───────────────────────────────────────────────────────────────
  socket.on('send_chat', ({ roomCode, message }) => {
    try {
      const room = RoomStore.get(roomCode);
      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      io.to(roomCode).emit('chat_message', {
        sender: player.playerName,
        message: message.slice(0, 200),
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('[send_chat error]', err);
    }
  });

  // ─── PLAY AGAIN ─────────────────────────────────────────────────────────────
  socket.on('play_again', ({ roomCode }) => {
    try {
      const code = (roomCode || '').toUpperCase().trim();
      const room = RoomStore.get(code);
      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      player.readyForRematch = true;

      const allReady = room.players.length === 2 && room.players.every((p) => p.readyForRematch);

      if (allReady) {
        room.markedNumbers = [];
        room.gameState = 'playing';
        room.winner = null;
        // The player who lost gets first turn next game (last winner = not first turn)
        const loser = room.players.find((p) => p.playerName !== room.winner) || room.players[0];
        room.currentTurn = loser ? loser.socketId : room.players[0].socketId;

        for (const p of room.players) {
          p.board = generateBoard();
          p.markedCells = Array.from({ length: 5 }, () => Array(5).fill(false));
          p.completedLines = [];
          p.readyForRematch = false;
        }

        RoomStore.set(code, room);

        io.to(code).emit('game_reset', {
          players: room.players.map((p) => ({ socketId: p.socketId, playerName: p.playerName, score: p.score })),
          currentTurn: room.currentTurn,
        });

        for (const p of room.players) {
          io.to(p.socketId).emit('your_board', {
            board: p.board,
            markedCells: p.markedCells,
            completedLines: p.completedLines,
          });
        }
      } else {
        socket.to(code).emit('player_wants_rematch', { playerName: player.playerName });
      }
    } catch (err) {
      console.error('[play_again error]', err);
    }
  });

  // ─── LEAVE ROOM ──────────────────────────────────────────────────────────────
  socket.on('leave_room', ({ roomCode }) => {
    try {
      const code = (roomCode || '').toUpperCase().trim();
      const room = RoomStore.get(code);
      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      console.log(`[Leave Room] ${player.playerName} left room ${code}`);

      // Notify the opponent that the room is closed because someone left
      socket.to(code).emit('room_closed', {
        message: `${player.playerName} left. Room has been closed.`,
      });

      // Delete the room and leave room channel
      RoomStore.delete(code);
      socket.leave(code);
    } catch (err) {
      console.error('[leave_room error]', err);
    }
  });

  // ─── DISCONNECT ──────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    try {
      const room = RoomStore.findBySocket(socket.id);
      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      console.log(`[Disconnect] ${player.playerName} left room ${room.roomCode}`);

      io.to(room.roomCode).emit('player_disconnected', {
        playerName: player.playerName,
        message: `${player.playerName} disconnected. Waiting for reconnect...`,
      });

      setTimeout(() => {
        const currentRoom = RoomStore.get(room.roomCode);
        if (currentRoom) {
          const stillDisconnected = currentRoom.players.find(
            (p) => p.playerName === player.playerName && p.socketId === socket.id
          );
          if (stillDisconnected) {
            io.to(room.roomCode).emit('room_closed', {
              message: `${player.playerName} left. Room has been closed.`,
            });
            RoomStore.delete(room.roomCode);
            console.log(`[Room Closed] ${room.roomCode}`);
          }
        }
      }, 30000);
    } catch (err) {
      console.error('[disconnect error]', err);
    }
  });
}

module.exports = { registerGameHandlers };
