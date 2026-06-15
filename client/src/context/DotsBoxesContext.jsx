import { createContext, useContext, useReducer } from 'react';

const initialState = {
  // Player info
  playerName: '',
  roomCode: '',
  mySocketId: '',

  // Opponent info
  opponentName: '',
  opponentConnected: true,

  // Grid state
  horizontalLines: [],
  verticalLines: [],
  boxes: [],

  // Turn tracking
  currentTurn: null,
  isMyTurn: false,

  // Scores
  myScore: 0,
  opponentScore: 0,
  drawnLineCount: 0,
  totalLines: 84,
  totalBoxes: 36,

  // Session tracking
  mySessionScore: 0,
  opponentSessionScore: 0,
  totalGames: 0,

  // Game flow
  gameState: 'home', // home | lobby | playing | finished
  winner: null,
  isWinner: false,
  isDraw: false,

  // UI
  disconnectMessage: null,
  lastMove: null, // { lineType, row, col, drawnBy, completedBoxes, extraTurn }
};

function dotsBoxesReducer(state, action) {
  switch (action.type) {
    case 'DB_SET_PLAYER_NAME':
      return { ...state, playerName: action.payload };

    case 'DB_ROOM_CREATED':
      return {
        ...state,
        roomCode: action.payload.roomCode,
        mySocketId: action.payload.player.socketId,
        gameState: 'lobby',
        winner: null,
        isWinner: false,
        isDraw: false,
        disconnectMessage: null,
        lastMove: null,
      };

    case 'DB_ROOM_JOINED': {
      return {
        ...state,
        roomCode: action.payload.roomCode,
        mySocketId: action.payload.player.socketId,
        opponentName: action.payload.opponent?.playerName || '',
        gameState: 'playing',
        winner: null,
        isWinner: false,
        isDraw: false,
        disconnectMessage: null,
        lastMove: null,
      };
    }

    case 'DB_ROOM_REJOINED': {
      const ct = action.payload.currentTurn || null;
      const scores = action.payload.scores || {};
      const myScoreVal = scores[state.playerName] || 0;
      const oppName = action.payload.opponent?.playerName || state.opponentName;
      const oppScoreVal = scores[oppName] || 0;
      return {
        ...state,
        roomCode: action.payload.roomCode,
        mySocketId: action.payload.player.socketId,
        opponentName: oppName,
        horizontalLines: action.payload.horizontalLines || state.horizontalLines,
        verticalLines: action.payload.verticalLines || state.verticalLines,
        boxes: action.payload.boxes || state.boxes,
        currentTurn: ct,
        isMyTurn: ct === action.payload.player.socketId,
        myScore: myScoreVal,
        opponentScore: oppScoreVal,
        drawnLineCount: action.payload.drawnLineCount || 0,
        gameState: action.payload.gameState === 'finished' ? 'finished' : 'playing',
        disconnectMessage: null,
      };
    }

    case 'DB_GAME_STARTED': {
      const opponent = action.payload.players.find(
        (p) => p.socketId !== state.mySocketId
      );
      const ct = action.payload.currentTurn || null;
      return {
        ...state,
        opponentName: opponent?.playerName || state.opponentName,
        horizontalLines: action.payload.horizontalLines,
        verticalLines: action.payload.verticalLines,
        boxes: action.payload.boxes,
        currentTurn: ct,
        isMyTurn: ct === state.mySocketId,
        myScore: 0,
        opponentScore: 0,
        drawnLineCount: action.payload.drawnLineCount || 0,
        totalLines: action.payload.totalLines || 84,
        totalBoxes: action.payload.totalBoxes || 36,
        gameState: 'playing',
      };
    }

    case 'DB_LINE_DRAWN': {
      const ct = action.payload.currentTurn || state.currentTurn;
      const scores = action.payload.scores || {};
      const myScoreVal = scores[state.playerName] || 0;
      const oppScoreVal = scores[state.opponentName] || 0;
      return {
        ...state,
        horizontalLines: action.payload.horizontalLines,
        verticalLines: action.payload.verticalLines,
        boxes: action.payload.boxes,
        currentTurn: ct,
        isMyTurn: ct === state.mySocketId,
        myScore: myScoreVal,
        opponentScore: oppScoreVal,
        drawnLineCount: action.payload.drawnLineCount || state.drawnLineCount,
        lastMove: {
          lineType: action.payload.lineType,
          row: action.payload.row,
          col: action.payload.col,
          drawnBy: action.payload.drawnBy,
          completedBoxes: action.payload.completedBoxes || [],
          extraTurn: action.payload.extraTurn || false,
        },
      };
    }

    case 'DB_GAME_OVER': {
      const scores = action.payload.scores || {};
      const myScoreVal = scores[state.playerName] || 0;
      const oppScoreVal = scores[state.opponentName] || 0;
      const players = action.payload.players || [];
      const mySession = players.find((p) => p.playerName === state.playerName)?.sessionScore || state.mySessionScore;
      const oppSession = players.find((p) => p.playerName === state.opponentName)?.sessionScore || state.opponentSessionScore;
      return {
        ...state,
        winner: action.payload.winner,
        isWinner: action.payload.winner === state.playerName,
        isDraw: action.payload.winner === 'draw',
        gameState: 'finished',
        currentTurn: null,
        isMyTurn: false,
        myScore: myScoreVal,
        opponentScore: oppScoreVal,
        mySessionScore: mySession,
        opponentSessionScore: oppSession,
        totalGames: state.totalGames + 1,
      };
    }

    case 'DB_GAME_RESET': {
      const ct = action.payload.currentTurn || null;
      return {
        ...state,
        horizontalLines: action.payload.horizontalLines,
        verticalLines: action.payload.verticalLines,
        boxes: action.payload.boxes,
        currentTurn: ct,
        isMyTurn: ct === state.mySocketId,
        myScore: 0,
        opponentScore: 0,
        drawnLineCount: 0,
        gameState: 'playing',
        winner: null,
        isWinner: false,
        isDraw: false,
        disconnectMessage: null,
        lastMove: null,
      };
    }

    case 'DB_PLAYER_DISCONNECTED':
      return {
        ...state,
        opponentConnected: false,
        disconnectMessage: action.payload.message,
      };

    case 'DB_PLAYER_RECONNECTED':
      return {
        ...state,
        opponentConnected: true,
        disconnectMessage: null,
      };

    case 'DB_LEAVE_ROOM':
      return {
        ...initialState,
        playerName: state.playerName,
        mySessionScore: state.mySessionScore,
        totalGames: state.totalGames,
      };

    default:
      return state;
  }
}

const DotsBoxesContext = createContext(null);

export function DotsBoxesProvider({ children }) {
  const [state, dispatch] = useReducer(dotsBoxesReducer, initialState);
  return (
    <DotsBoxesContext.Provider value={{ state, dispatch }}>
      {children}
    </DotsBoxesContext.Provider>
  );
}

export function useDotsBoxes() {
  return useContext(DotsBoxesContext);
}

export { initialState };
