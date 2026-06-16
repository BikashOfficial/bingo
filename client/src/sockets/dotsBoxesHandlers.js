import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSocket } from "../context/SocketContext";
import { useDotsBoxes } from "../context/DotsBoxesContext";

const DB_EVENTS = [
  "db_room_created",
  "db_room_joined",
  "db_room_rejoined",
  "db_room_error",
  "db_error",
  "db_game_started",
  "db_line_drawn",
  "db_game_over",
  "db_not_your_turn",
  "db_game_reset",
  "db_player_wants_rematch",
  "db_player_disconnected",
  "db_player_reconnected",
  "db_room_closed",
];

/**
 * Registers all Socket.IO event listeners for the Dots & Boxes game.
 * Maps server events to DotsBoxesContext dispatch actions.
 */
export function useDotsBoxesListeners() {
  const { socket, connected } = useSocket();
  const { state, dispatch } = useDotsBoxes();
  const navigate = useNavigate();
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ── Auto-Rejoin on socket reconnect or ID mismatch ──
  useEffect(() => {
    if (!socket || !connected) return;
    const { roomCode, playerName, gameState, mySocketId } = state;
    if (!roomCode || !playerName || gameState === 'home') return;

    if (mySocketId && mySocketId !== socket.id) {
      console.log(`[DB] Auto-rejoining room ${roomCode} as ${playerName} (socket ID mismatch: local=${socket.id}, state=${mySocketId})`);
      socket.emit("db_join_room", { roomCode, playerName });
    }
  }, [socket, connected, state.roomCode, state.playerName, state.mySocketId]);

  useEffect(() => {
    if (!socket) return;

    // Remove any previous listeners first
    DB_EVENTS.forEach((e) => socket.off(e));

    // ── Room Created ──────────────────────────────────────────────────────
    socket.on("db_room_created", (data) => {
      dispatch({ type: "DB_ROOM_CREATED", payload: data });
      navigate("/dotsboxes/lobby");
    });

    // ── Room Joined (2nd player) ──────────────────────────────────────────
    socket.on("db_room_joined", (data) => {
      dispatch({ type: "DB_ROOM_JOINED", payload: data });
      navigate("/dotsboxes/game");
    });

    // ── Room Rejoined (reconnect) ─────────────────────────────────────────
    socket.on("db_room_rejoined", (data) => {
      dispatch({ type: "DB_ROOM_REJOINED", payload: data });
      if (data.gameState === "finished") {
        navigate("/dotsboxes/result");
      } else {
        navigate("/dotsboxes/game");
      }
      toast.success("Reconnected to game!");
    });

    // ── Room Errors ───────────────────────────────────────────────────────
    socket.on("db_room_error", ({ type, message }) => {
      toast.error(message);
    });

    socket.on("db_error", ({ message }) => {
      toast.error(message);
    });

    // ── Game Started ──────────────────────────────────────────────────────
    socket.on("db_game_started", (data) => {
      dispatch({ type: "DB_GAME_STARTED", payload: data });
      navigate("/dotsboxes/game");
      toast.success("Game started! Your turn to draw! 🔲", { icon: "🎯" });
    });

    // ── Line Drawn ────────────────────────────────────────────────────────
    socket.on("db_line_drawn", (data) => {
      dispatch({ type: "DB_LINE_DRAWN", payload: data });
      if (data.completedBoxes && data.completedBoxes.length > 0) {
        const count = data.completedBoxes.length;
        toast(`${data.drawnBy} claimed ${count} box${count > 1 ? 'es' : ''}! Extra turn! 🎉`, {
          icon: "⭐",
          style: { background: "#92400e", color: "#fff" },
          duration: 1500,
        });
      }
    });

    // ── Game Over ─────────────────────────────────────────────────────────
    socket.on("db_game_over", (data) => {
      dispatch({ type: "DB_GAME_OVER", payload: data });
      navigate("/dotsboxes/result");
    });

    // ── Not Your Turn ─────────────────────────────────────────────────────
    socket.on("db_not_your_turn", ({ message }) => {
      toast(message, {
        icon: "🚫",
        style: {
          background: "#1e293b",
          color: "#f87171",
          border: "1px solid rgba(248,113,113,0.3)",
        },
        duration: 1500,
      });
    });

    // ── Game Reset (rematch) ──────────────────────────────────────────────
    socket.on("db_game_reset", (data) => {
      dispatch({ type: "DB_GAME_RESET", payload: data });
      navigate("/dotsboxes/game");
      toast.success("New game started!", { icon: "🔄" });
    });

    // ── Opponent wants rematch ────────────────────────────────────────────
    socket.on("db_player_wants_rematch", ({ playerName }) => {
      toast(`${playerName} wants a rematch!`, { icon: "🔁" });
    });

    // ── Player disconnected ───────────────────────────────────────────────
    socket.on("db_player_disconnected", (data) => {
      dispatch({ type: "DB_PLAYER_DISCONNECTED", payload: data });
      toast.error(data.message, { duration: 6000 });
    });

    // ── Player reconnected ────────────────────────────────────────────────
    socket.on("db_player_reconnected", ({ playerName }) => {
      dispatch({ type: "DB_PLAYER_RECONNECTED" });
      toast.success(`${playerName} reconnected!`);
    });

    // ── Room closed ───────────────────────────────────────────────────────
    socket.on("db_room_closed", ({ message }) => {
      dispatch({ type: "DB_LEAVE_ROOM" });
      toast.error(message, { duration: 5000 });
      navigate("/dotsboxes");
    });

    return () => {
      DB_EVENTS.forEach((e) => socket.off(e));
    };
  }, [socket, dispatch, navigate]);
}
