const { generateRoomCode } = require("../utils/roomCode");
const DotsBoxesStore = require("../services/dotsBoxesStore");

// ─── Grid Constants ──────────────────────────────────────────────────────────
// 7×7 dots → 6×6 boxes
const ROWS = 7; // dot rows
const COLS = 7; // dot cols
const BOX_ROWS = ROWS - 1; // 6
const BOX_COLS = COLS - 1; // 6
const H_LINES = ROWS * BOX_COLS; // 7×6 = 42 horizontal lines
const V_LINES = BOX_ROWS * COLS; // 6×7 = 42 vertical lines
const TOTAL_LINES = H_LINES + V_LINES; // 84
const TOTAL_BOXES = BOX_ROWS * BOX_COLS; // 36

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Create a fresh game state grid */
function createEmptyGrid() {
  // horizontalLines[row][col] — row: 0..4, col: 0..3
  const horizontalLines = Array.from({ length: ROWS }, () =>
    Array.from({ length: BOX_COLS }, () => ({ drawn: false, drawnBy: null }))
  );
  // verticalLines[row][col] — row: 0..3, col: 0..4
  const verticalLines = Array.from({ length: BOX_ROWS }, () =>
    Array.from({ length: COLS }, () => ({ drawn: false, drawnBy: null }))
  );
  // boxes[row][col] — row: 0..3, col: 0..3
  const boxes = Array.from({ length: BOX_ROWS }, () =>
    Array(BOX_COLS).fill(null)
  );
  return { horizontalLines, verticalLines, boxes };
}

/** Count total drawn lines */
function countDrawnLines(room) {
  let count = 0;
  for (const row of room.horizontalLines) {
    for (const line of row) {
      if (line.drawn) count++;
    }
  }
  for (const row of room.verticalLines) {
    for (const line of row) {
      if (line.drawn) count++;
    }
  }
  return count;
}

/**
 * Check which boxes were completed by drawing a line.
 * Returns array of { row, col } for newly completed boxes.
 */
function checkCompletedBoxes(room, lineType, row, col, playerName) {
  const completed = [];

  if (lineType === "h") {
    // A horizontal line at (row, col) is the top edge of box (row, col)
    // and the bottom edge of box (row-1, col)
    // Top edge: check box below (row, col)
    if (row < BOX_ROWS && col < BOX_COLS) {
      if (isBoxComplete(room, row, col)) {
        room.boxes[row][col] = playerName;
        completed.push({ row, col });
      }
    }
    // Bottom edge: check box above (row-1, col)
    if (row > 0 && col < BOX_COLS) {
      if (isBoxComplete(room, row - 1, col)) {
        room.boxes[row - 1][col] = playerName;
        completed.push({ row: row - 1, col });
      }
    }
  } else if (lineType === "v") {
    // A vertical line at (row, col) is the left edge of box (row, col)
    // and the right edge of box (row, col-1)
    // Left edge: check box to the right (row, col)
    if (row < BOX_ROWS && col < BOX_COLS) {
      if (isBoxComplete(room, row, col)) {
        room.boxes[row][col] = playerName;
        completed.push({ row, col });
      }
    }
    // Right edge: check box to the left (row, col-1)
    if (row < BOX_ROWS && col > 0) {
      if (isBoxComplete(room, row, col - 1)) {
        room.boxes[row][col - 1] = playerName;
        completed.push({ row, col: col - 1 });
      }
    }
  }

  return completed;
}

/**
 * Check if all 4 sides of a box are drawn.
 * Box (r, c) has:
 *   top:    horizontalLines[r][c]
 *   bottom: horizontalLines[r+1][c]
 *   left:   verticalLines[r][c]
 *   right:  verticalLines[r][c+1]
 */
function isBoxComplete(room, r, c) {
  if (room.boxes[r][c] !== null) return false; // already claimed
  const top = room.horizontalLines[r][c].drawn;
  const bottom = room.horizontalLines[r + 1][c].drawn;
  const left = room.verticalLines[r][c].drawn;
  const right = room.verticalLines[r][c + 1].drawn;
  return top && bottom && left && right;
}

/** Count boxes per player */
function countBoxes(room) {
  const scores = {};
  for (const player of room.players) {
    scores[player.playerName] = 0;
  }
  for (let r = 0; r < BOX_ROWS; r++) {
    for (let c = 0; c < BOX_COLS; c++) {
      const owner = room.boxes[r][c];
      if (owner && scores[owner] !== undefined) {
        scores[owner]++;
      }
    }
  }
  return scores;
}

/** Serialize game state to send to clients */
function serializeGameState(room) {
  return {
    horizontalLines: room.horizontalLines,
    verticalLines: room.verticalLines,
    boxes: room.boxes,
    currentTurn: room.currentTurn,
    scores: countBoxes(room),
    drawnLineCount: countDrawnLines(room),
    totalLines: TOTAL_LINES,
    totalBoxes: TOTAL_BOXES,
  };
}

// ─── Socket Handlers ─────────────────────────────────────────────────────────

function registerDotsBoxesHandlers(io, socket) {
  // ─── CREATE ROOM ──────────────────────────────────────────────────────────
  socket.on("db_create_room", ({ playerName }) => {
    try {
      let roomCode;
      do {
        roomCode = generateRoomCode();
      } while (DotsBoxesStore.has(roomCode));

      const grid = createEmptyGrid();
      const player = {
        socketId: socket.id,
        playerName: playerName || "Player 1",
        score: 0,
      };

      const room = {
        roomCode,
        players: [player],
        ...grid,
        currentTurn: null,
        gameState: "waiting",
        winner: null,
        createdAt: Date.now(),
      };

      DotsBoxesStore.set(roomCode, room);
      socket.join(roomCode);

      socket.emit("db_room_created", {
        roomCode,
        player: { socketId: socket.id, playerName: player.playerName },
      });

      console.log(`[DB Room Created] ${roomCode} by ${player.playerName}`);
    } catch (err) {
      socket.emit("db_error", { message: "Failed to create room." });
      console.error("[db_create_room error]", err);
    }
  });

  // ─── JOIN ROOM ────────────────────────────────────────────────────────────
  socket.on("db_join_room", ({ roomCode, playerName }) => {
    try {
      const code = (roomCode || "").toUpperCase().trim();
      const room = DotsBoxesStore.get(code);

      if (!room) {
        socket.emit("db_room_error", {
          type: "not_found",
          message: "Invalid room code.",
        });
        return;
      }

      // Reconnect check
      const existingIdx = room.players.findIndex(
        (p) => p.playerName === playerName
      );
      if (existingIdx !== -1) {
        const oldSocketId = room.players[existingIdx].socketId;
        room.players[existingIdx].socketId = socket.id;

        // If it was this player's turn, update currentTurn to the new socket ID
        if (room.currentTurn === oldSocketId) {
          room.currentTurn = socket.id;
        }

        socket.join(code);
        if (oldSocketId !== socket.id) {
          io.to(code).emit("db_player_reconnected", { playerName });
        }
        socket.emit("db_room_rejoined", {
          roomCode: code,
          player: room.players[existingIdx],
          opponent: room.players.find((_, i) => i !== existingIdx) || null,
          gameState: room.gameState,
          ...serializeGameState(room),
        });
        return;
      }

      if (room.gameState === "finished") {
        socket.emit("db_room_error", {
          type: "finished",
          message: "This game has already ended.",
        });
        return;
      }

      if (room.players.length >= 2) {
        socket.emit("db_room_error", {
          type: "full",
          message: "Room is full.",
        });
        return;
      }

      const player = {
        socketId: socket.id,
        playerName: playerName || "Player 2",
        score: 0,
      };

      room.players.push(player);
      room.gameState = "playing";
      room.currentTurn = room.players[0].socketId;
      DotsBoxesStore.set(code, room);
      socket.join(code);

      // Tell the joiner
      socket.emit("db_room_joined", {
        roomCode: code,
        player: { socketId: socket.id, playerName: player.playerName },
        opponent: {
          socketId: room.players[0].socketId,
          playerName: room.players[0].playerName,
        },
      });

      // Tell everyone the game started
      io.to(code).emit("db_game_started", {
        players: room.players.map((p) => ({
          socketId: p.socketId,
          playerName: p.playerName,
        })),
        currentTurn: room.currentTurn,
        ...serializeGameState(room),
      });

      console.log(
        `[DB Room Joined] ${code} — ${player.playerName} joined. Turn: ${room.players[0].playerName}`
      );
    } catch (err) {
      socket.emit("db_error", { message: "Failed to join room." });
      console.error("[db_join_room error]", err);
    }
  });

  // ─── DRAW LINE ────────────────────────────────────────────────────────────
  socket.on("db_draw_line", ({ roomCode, lineType, row, col }) => {
    try {
      const room = DotsBoxesStore.get(roomCode);
      if (!room || room.gameState !== "playing") return;

      // Turn check
      if (room.currentTurn !== socket.id) {
        socket.emit("db_not_your_turn", { message: "It's not your turn!" });
        return;
      }

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      // Validate and draw the line
      let lineRef;
      if (lineType === "h") {
        if (row < 0 || row >= ROWS || col < 0 || col >= BOX_COLS) return;
        lineRef = room.horizontalLines[row][col];
      } else if (lineType === "v") {
        if (row < 0 || row >= BOX_ROWS || col < 0 || col >= COLS) return;
        lineRef = room.verticalLines[row][col];
      } else {
        return;
      }

      if (lineRef.drawn) return; // already drawn

      lineRef.drawn = true;
      lineRef.drawnBy = player.playerName;

      // Check if boxes were completed
      const completedBoxes = checkCompletedBoxes(
        room,
        lineType,
        row,
        col,
        player.playerName
      );

      const boxesScored = completedBoxes.length > 0;

      // If a box was completed, the player gets another turn
      // Otherwise, switch to the other player
      if (!boxesScored) {
        const otherPlayer = room.players.find(
          (p) => p.socketId !== socket.id
        );
        if (otherPlayer) {
          room.currentTurn = otherPlayer.socketId;
        }
      }
      // If boxesScored, currentTurn stays the same (extra turn)

      const scores = countBoxes(room);
      const drawnCount = countDrawnLines(room);

      // Check if game is over (all lines drawn)
      if (drawnCount >= TOTAL_LINES) {
        room.gameState = "finished";
        room.currentTurn = null;

        const p1Score = scores[room.players[0].playerName] || 0;
        const p2Score = scores[room.players[1].playerName] || 0;

        if (p1Score > p2Score) {
          room.winner = room.players[0].playerName;
        } else if (p2Score > p1Score) {
          room.winner = room.players[1].playerName;
        } else {
          room.winner = "draw";
        }

        // Update player scores for session tracking
        room.players[0].score += p1Score;
        room.players[1].score += p2Score;

        io.to(roomCode).emit("db_line_drawn", {
          lineType,
          row,
          col,
          drawnBy: player.playerName,
          completedBoxes,
          ...serializeGameState(room),
        });

        io.to(roomCode).emit("db_game_over", {
          winner: room.winner,
          scores,
          players: room.players.map((p) => ({
            playerName: p.playerName,
            sessionScore: p.score,
          })),
        });

        console.log(
          `[DB Game Over] Room ${roomCode} — Winner: ${room.winner}, Scores: ${JSON.stringify(scores)}`
        );
      } else {
        // Emit line drawn event
        io.to(roomCode).emit("db_line_drawn", {
          lineType,
          row,
          col,
          drawnBy: player.playerName,
          completedBoxes,
          extraTurn: boxesScored,
          ...serializeGameState(room),
        });
      }

      DotsBoxesStore.set(roomCode, room);
    } catch (err) {
      console.error("[db_draw_line error]", err);
    }
  });

  // ─── PLAY AGAIN ───────────────────────────────────────────────────────────
  socket.on("db_play_again", ({ roomCode }) => {
    try {
      const code = (roomCode || "").toUpperCase().trim();
      const room = DotsBoxesStore.get(code);
      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      player.readyForRematch = true;

      const allReady =
        room.players.length === 2 &&
        room.players.every((p) => p.readyForRematch);

      if (allReady) {
        const grid = createEmptyGrid();
        Object.assign(room, grid);
        room.gameState = "playing";
        room.winner = null;

        // Loser gets first turn
        const loser =
          room.players.find((p) => p.playerName !== room.winner) ||
          room.players[0];
        room.currentTurn = loser.socketId;

        for (const p of room.players) {
          p.readyForRematch = false;
        }

        DotsBoxesStore.set(code, room);

        io.to(code).emit("db_game_reset", {
          players: room.players.map((p) => ({
            socketId: p.socketId,
            playerName: p.playerName,
            sessionScore: p.score,
          })),
          currentTurn: room.currentTurn,
          ...serializeGameState(room),
        });
      } else {
        socket
          .to(code)
          .emit("db_player_wants_rematch", { playerName: player.playerName });
      }
    } catch (err) {
      console.error("[db_play_again error]", err);
    }
  });

  // ─── LEAVE ROOM ───────────────────────────────────────────────────────────
  socket.on("db_leave_room", ({ roomCode }) => {
    try {
      const code = (roomCode || "").toUpperCase().trim();
      const room = DotsBoxesStore.get(code);
      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      console.log(`[DB Leave Room] ${player.playerName} left room ${code}`);

      socket.to(code).emit("db_room_closed", {
        message: `${player.playerName} left. Room has been closed.`,
      });

      DotsBoxesStore.delete(code);
      socket.leave(code);
    } catch (err) {
      console.error("[db_leave_room error]", err);
    }
  });

  // ─── DISCONNECT (handled alongside game disconnect) ───────────────────────
  // We listen to disconnect only for DotsBoxes rooms
  socket.on("disconnect", () => {
    try {
      const room = DotsBoxesStore.findBySocket(socket.id);
      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      const disconnectedRoomCode = room.roomCode;
      const disconnectedSocketId = socket.id;
      const disconnectedPlayerName = player.playerName;

      console.log(
        `[DB Disconnect] ${disconnectedPlayerName} left room ${disconnectedRoomCode}`
      );

      // Notify only the OTHER players (not the disconnected socket itself)
      socket.to(disconnectedRoomCode).emit("db_player_disconnected", {
        playerName: disconnectedPlayerName,
        message: `${disconnectedPlayerName} disconnected. Waiting for reconnect...`,
      });

      setTimeout(() => {
        const currentRoom = DotsBoxesStore.get(disconnectedRoomCode);
        if (!currentRoom) return;

        // Check if the player reconnected: their socketId would have changed
        const reconnectedPlayer = currentRoom.players.find(
          (p) => p.playerName === disconnectedPlayerName
        );

        // If they reconnected (socketId is different), do nothing
        if (!reconnectedPlayer || reconnectedPlayer.socketId !== disconnectedSocketId) {
          console.log(`[DB Reconnect OK] ${disconnectedPlayerName} reconnected to ${disconnectedRoomCode}`);
          return;
        }

        // Player never came back — notify other players and close room
        const remainingPlayers = currentRoom.players.filter(
          (p) => p.playerName !== disconnectedPlayerName
        );
        for (const p of remainingPlayers) {
          io.to(p.socketId).emit("db_room_closed", {
            message: `${disconnectedPlayerName} left. Room has been closed.`,
          });
        }
        DotsBoxesStore.delete(disconnectedRoomCode);
        console.log(`[DB Room Closed] ${disconnectedRoomCode} — ${disconnectedPlayerName} never reconnected`);
      }, 30000);
    } catch (err) {
      console.error("[db disconnect error]", err);
    }
  });
}

module.exports = { registerDotsBoxesHandlers };
