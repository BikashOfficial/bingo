import { createContext, useContext, useReducer, useCallback } from 'react';

const ChatContext = createContext(null);

const initialState = {
  roomCode: null,
  me: null,          // { socketId, displayName, avatar }
  members: [],       // all members in room
  messages: [],      // message objects
  typingUsers: [],   // displayNames of typing users
  connected: false,
};

function chatReducer(state, action) {
  switch (action.type) {
    case 'SET_ROOM': {
      const uniqueMessages = [];
      const seenIds = new Set();
      if (action.payload.messages) {
        for (const msg of action.payload.messages) {
          if (msg && msg.id && !seenIds.has(msg.id)) {
            seenIds.add(msg.id);
            uniqueMessages.push(msg);
          }
        }
      }
      return {
        ...state,
        roomCode: action.payload.roomCode,
        me: action.payload.member,
        members: action.payload.members,
        messages: uniqueMessages,
        connected: true,
      };
    }
    case 'MEMBER_UPDATE':
      return { ...state, members: action.payload };
    case 'ADD_MESSAGE':
      if (state.messages.some((m) => m.id === action.payload.id)) {
        return state;
      }
      return { ...state, messages: [...state.messages, action.payload] };
    case 'EDIT_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.messageId
            ? { ...m, text: action.payload.newText, edited: true, editedAt: action.payload.editedAt }
            : m
        ),
      };
    case 'UNSEND_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.messageId
            ? { ...m, unsent: true, text: '', gifUrl: null }
            : m
        ),
      };
    case 'REACTION_UPDATE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.messageId
            ? { ...m, reactions: action.payload.reactions }
            : m
        ),
      };
    case 'TYPING_UPDATE': {
      const { displayName, isTyping } = action.payload;
      const filtered = state.typingUsers.filter((n) => n !== displayName);
      return {
        ...state,
        typingUsers: isTyping ? [...filtered, displayName] : filtered,
      };
    }
    case 'USER_LEFT':
      return { ...state, members: action.payload.members };
    case 'LEAVE':
      return initialState;
    default:
      return state;
  }
}

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const addSystemMessage = useCallback((text) => {
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: `sys-${Date.now()}`,
        type: 'system',
        text,
        timestamp: Date.now(),
        reactions: {},
        unsent: false,
      },
    });
  }, []);

  return (
    <ChatContext.Provider value={{ state, dispatch, addSystemMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChat() {
  return useContext(ChatContext);
}
