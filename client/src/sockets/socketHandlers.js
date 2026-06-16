import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSocket } from "../context/SocketContext";
import { useGame } from "../context/GameContext";

/**
 * Registers all Socket.IO event listeners and maps them to GameContext actions.
 * Must be used inside a component that is rendered within SocketProvider + GameProvider.
 * Handles: room flow, board updates, turn tracking, chat, disconnect.
 */
export function useSocketHandlers() {
  const { socket, connected } = useSocket();
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  // Track which socket ID we've already registered on to avoid duplicate listeners
  const registeredSocketIdRef = useRef(null);

  // ── Auto-Rejoin on socket reconnect or ID mismatch ──
  useEffect(() => {
    if (!socket || !connected) return;
    const { roomCode, playerName, gameState, mySocketId } = state;
    if (!roomCode || !playerName || gameState === "home") return;

    if (mySocketId && mySocketId !== socket.id) {
      console.log(
        `[SocketHandlers] Auto-rejoining room ${roomCode} as ${playerName} (socket ID mismatch: local=${socket.id}, state=${mySocketId})`,
      );
      socket.emit("join_room", { roomCode, playerName });
    }
  }, [socket, connected, state.roomCode, state.playerName, state.mySocketId]);

  useEffect(() => {
    if (!socket || registeredSocketIdRef.current === socket.id) return;
    registeredSocketIdRef.current = socket.id;

    // ── Room Created ──────────────────────────────────────────────────────────
    socket.on("room_created", (data) => {
      dispatch({ type: "ROOM_CREATED", payload: data });
      navigate("/bingo/lobby");
    });

    // ── Room Joined (2nd player joining) ─────────────────────────────────────
    socket.on("room_joined", (data) => {
      dispatch({ type: "ROOM_JOINED", payload: data });
      navigate("/bingo/game");
    });

    // ── Room Rejoined (reconnect) ─────────────────────────────────────────────
    socket.on("room_rejoined", (data) => {
      dispatch({ type: "ROOM_REJOINED", payload: data });
      if (data.gameState === "finished") {
        navigate("/bingo/result");
      } else {
        navigate("/bingo/game");
      }
      toast.success("Reconnected to game!");
    });

    // ── Room Errors ───────────────────────────────────────────────────────────
    socket.on("room_error", ({ type, message }) => {
      toast.error(message);
    });

    // ── Game Started (both players in) ────────────────────────────────────────
    socket.on("game_started", (data) => {
      dispatch({ type: "GAME_STARTED", payload: data });
      navigate("/bingo/game");
      toast.success("Game started! Good luck! 🎲", { icon: "🎯" });
    });

    // ── Private board data ────────────────────────────────────────────────────
    socket.on("your_board", (data) => {
      dispatch({ type: "YOUR_BOARD", payload: data });
    });

    // ── Board updated after a number is marked ────────────────────────────────
    socket.on("board_updated", (data) => {
      dispatch({ type: "BOARD_UPDATED", payload: data });
    });

    // ── A number was marked globally ──────────────────────────────────────────
    socket.on("number_marked", (data) => {
      dispatch({ type: "NUMBER_MARKED", payload: data });
    });

    // ── Line completed ────────────────────────────────────────────────────────
    socket.on("line_completed", ({ completedLines, newLines }) => {
      const lineCount = newLines.length;
      const letters = ["B", "I", "N", "G", "O"];
      const totalNow = completedLines.length;
      toast(
        `Line ${totalNow} complete! ${totalNow < 5 ? letters[totalNow - 1] + " ✓" : "BINGO!"}`,
        {
          icon: totalNow === 5 ? "🎉" : "⚡",
          style: { background: "#7c3aed", color: "#fff" },
        },
      );
    });

    // ── BINGO won ─────────────────────────────────────────────────────────────
    socket.on("bingo_won", (data) => {
      dispatch({ type: "BINGO_WON", payload: data });
      navigate("/bingo/result");
    });

    // ── Chat message ──────────────────────────────────────────────────────────
    socket.on("chat_message", (data) => {
      dispatch({ type: "CHAT_MESSAGE", payload: data });
    });

    // ── Player disconnected ───────────────────────────────────────────────────
    socket.on("player_disconnected", (data) => {
      dispatch({ type: "PLAYER_DISCONNECTED", payload: data });
      toast.error(data.message, { duration: 6000 });
    });

    // ── Player reconnected ────────────────────────────────────────────────────
    socket.on("player_reconnected", ({ playerName }) => {
      dispatch({ type: "PLAYER_RECONNECTED" });
      toast.success(`${playerName} reconnected!`);
    });

    // ── Not your turn ─────────────────────────────────────────────────────────
    socket.on("not_your_turn", ({ message }) => {
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

    // ── Game reset for rematch ────────────────────────────────────────────────
    socket.on("game_reset", (data) => {
      dispatch({ type: "GAME_RESET", payload: data });
      navigate("/bingo/game");
      toast.success("New game started!", { icon: "🔄" });
    });

    // ── Opponent wants rematch ────────────────────────────────────────────────
    socket.on("player_wants_rematch", ({ playerName }) => {
      toast(`${playerName} wants a rematch!`, { icon: "🔁" });
    });

    // ── Room closed ───────────────────────────────────────────────────────────
    socket.on("room_closed", ({ message }) => {
      dispatch({ type: "LEAVE_ROOM" });
      toast.error(message, { duration: 5000 });
      navigate("/bingo");
    });

    return () => {
      registeredSocketIdRef.current = null;
      const events = [
        "room_created",
        "room_joined",
        "room_rejoined",
        "room_error",
        "game_started",
        "your_board",
        "board_updated",
        "number_marked",
        "line_completed",
        "bingo_won",
        "chat_message",
        "player_disconnected",
        "player_reconnected",
        "game_reset",
        "player_wants_rematch",
        "room_closed",
        "not_your_turn",
      ];
      events.forEach((e) => socket.off(e));
    };
  }, [socket, dispatch, navigate]);
}
