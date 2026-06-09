import { createContext, useContext, useReducer } from 'react';

const initialState = {
  // Player info
  playerName: '',
  roomCode: '',
  mySocketId: '',

  // Opponent info
  opponentName: '',
  opponentScore: 0,
  opponentConnected: true,

  // Board state
  myBoard: [],
  myMarkedCells: [],
  myCompletedLines: [],

  // Shared state
  markedNumbers: [],

  // BINGO tracking (B=0 I=1 N=2 G=3 O=4)
  bingoLetters: [false, false, false, false, false],

  // Turn tracking
  currentTurn: null,   // socket ID of who should mark next
  isMyTurn: false,

  // Session scores
  myScore: 0,
  opponentScoreSession: 0,
  totalGames: 0,

  // Game flow
  gameState: 'home', // home | lobby | playing | finished
  winner: null,
  isWinner: false,

  // Chat
  chatMessages: [],
  unreadChat: 0,

  // UI
  disconnectMessage: null,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_PLAYER_NAME':
      return { ...state, playerName: action.payload };

    case 'ROOM_CREATED':
      return {
        ...state,
        roomCode: action.payload.roomCode,
        mySocketId: action.payload.player.socketId,
        myBoard: action.payload.player.board,
        myMarkedCells: Array.from({ length: 5 }, () => Array(5).fill(false)),
        myCompletedLines: [],
        markedNumbers: [],
        bingoLetters: [false, false, false, false, false],
        currentTurn: null,
        isMyTurn: false,
        gameState: 'lobby',
        winner: null,
        isWinner: false,
        disconnectMessage: null,
        chatMessages: [],
      };

    case 'ROOM_JOINED': {
      const ct = action.payload.currentTurn || null;
      return {
        ...state,
        roomCode: action.payload.roomCode,
        mySocketId: action.payload.player.socketId,
        myBoard: action.payload.player.board,
        myMarkedCells: Array.from({ length: 5 }, () => Array(5).fill(false)),
        myCompletedLines: [],
        opponentName: action.payload.opponent?.playerName || '',
        opponentScore: action.payload.opponent?.score || 0,
        markedNumbers: action.payload.markedNumbers || [],
        bingoLetters: [false, false, false, false, false],
        currentTurn: ct,
        isMyTurn: ct === action.payload.player.socketId,
        gameState: 'playing',
        winner: null,
        isWinner: false,
        disconnectMessage: null,
        chatMessages: [],
      };
    }

    case 'ROOM_REJOINED':
      return {
        ...state,
        roomCode: action.payload.roomCode,
        mySocketId: action.payload.player.socketId,
        myBoard: action.payload.player.board,
        myMarkedCells: action.payload.player.markedCells,
        myCompletedLines: action.payload.player.completedLines,
        opponentName: action.payload.opponent?.playerName || state.opponentName,
        markedNumbers: action.payload.markedNumbers || state.markedNumbers,
        currentTurn: action.payload.currentTurn || state.currentTurn,
        isMyTurn: action.payload.currentTurn === action.payload.player.socketId,
        gameState: action.payload.gameState === 'playing' ? 'playing' : state.gameState,
        disconnectMessage: null,
      };

    case 'GAME_STARTED': {
      const opponent = action.payload.players.find((p) => p.socketId !== state.mySocketId);
      const ct = action.payload.currentTurn || null;
      return {
        ...state,
        opponentName: opponent?.playerName || state.opponentName,
        opponentScore: opponent?.score || 0,
        currentTurn: ct,
        isMyTurn: ct === state.mySocketId,
        gameState: 'playing',
      };
    }

    case 'YOUR_BOARD':
      return {
        ...state,
        myBoard: action.payload.board || state.myBoard,
        myMarkedCells: action.payload.markedCells,
        myCompletedLines: action.payload.completedLines,
      };

    case 'BOARD_UPDATED': {
      const newBingoLetters = [...state.bingoLetters];
      const completedLines = action.payload.completedLines || [];
      for (let i = 0; i < 5; i++) {
        newBingoLetters[i] = completedLines.length > i;
      }
      return {
        ...state,
        myMarkedCells: action.payload.markedCells,
        myCompletedLines: completedLines,
        bingoLetters: newBingoLetters,
      };
    }

    case 'NUMBER_MARKED': {
      const ct = action.payload.currentTurn || state.currentTurn;
      return {
        ...state,
        markedNumbers: action.payload.markedNumbers,
        currentTurn: ct,
        isMyTurn: ct === state.mySocketId,
      };
    }

    case 'BINGO_WON': {
      const scores = action.payload.scores || [];
      const myScore = scores.find((s) => s.playerName === state.playerName)?.score ?? state.myScore;
      const oppScore = scores.find((s) => s.playerName !== state.playerName)?.score ?? state.opponentScoreSession;
      return {
        ...state,
        winner: action.payload.winner,
        isWinner: action.payload.winner === state.playerName,
        gameState: 'finished',
        currentTurn: null,
        isMyTurn: false,
        myScore,
        opponentScoreSession: oppScore,
        totalGames: state.totalGames + 1,
      };
    }

    case 'CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: [
          ...state.chatMessages,
          action.payload,
        ].slice(-100),
        unreadChat: state.chatOpen ? state.unreadChat : state.unreadChat + 1,
      };

    case 'CLEAR_UNREAD_CHAT':
      return { ...state, unreadChat: 0 };

    case 'PLAYER_DISCONNECTED':
      return { ...state, opponentConnected: false, disconnectMessage: action.payload.message };

    case 'PLAYER_RECONNECTED':
      return { ...state, opponentConnected: true, disconnectMessage: null };

    case 'GAME_RESET': {
      const ct = action.payload.currentTurn || null;
      return {
        ...state,
        markedNumbers: [],
        myMarkedCells: Array.from({ length: 5 }, () => Array(5).fill(false)),
        myCompletedLines: [],
        bingoLetters: [false, false, false, false, false],
        currentTurn: ct,
        isMyTurn: ct === state.mySocketId,
        gameState: 'playing',
        winner: null,
        isWinner: false,
        disconnectMessage: null,
      };
    }

    case 'LEAVE_ROOM':
      return {
        ...initialState,
        playerName: state.playerName,
        myScore: state.myScore,
        totalGames: state.totalGames,
      };

    case 'SET_OPPONENT_NAME':
      return { ...state, opponentName: action.payload };

    default:
      return state;
  }
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}

export { initialState };
