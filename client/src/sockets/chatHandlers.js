import { useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../context/ChatContext';

export function useChatListeners() {
  const { socket } = useSocket();
  const { dispatch, addSystemMessage } = useChat();

  useEffect(() => {
    if (!socket) return;

    const onRoomCreated = ({ roomCode, member, members }) => {
      dispatch({ type: 'SET_ROOM', payload: { roomCode, member, members, messages: [] } });
    };

    const onRoomJoined = ({ roomCode, member, members, messages }) => {
      dispatch({ type: 'SET_ROOM', payload: { roomCode, member, members, messages } });
    };

    const onNewMessage = ({ message }) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    };

    const onMessageEdited = ({ messageId, newText, editedAt }) => {
      dispatch({ type: 'EDIT_MESSAGE', payload: { messageId, newText, editedAt } });
    };

    const onMessageUnsent = ({ messageId }) => {
      dispatch({ type: 'UNSEND_MESSAGE', payload: { messageId } });
    };

    const onReactionUpdate = ({ messageId, reactions }) => {
      dispatch({ type: 'REACTION_UPDATE', payload: { messageId, reactions } });
    };

    const onTypingUpdate = ({ displayName, isTyping }) => {
      dispatch({ type: 'TYPING_UPDATE', payload: { displayName, isTyping } });
    };

    const onMemberUpdate = ({ members }) => {
      dispatch({ type: 'MEMBER_UPDATE', payload: members });
    };

    const onUserJoined = ({ member, members, systemMessage }) => {
      dispatch({ type: 'MEMBER_UPDATE', payload: members });
      if (systemMessage) addSystemMessage(systemMessage);
    };

    const onUserLeft = ({ displayName, members, systemMessage }) => {
      dispatch({ type: 'USER_LEFT', payload: { members } });
      if (systemMessage) addSystemMessage(systemMessage);
    };

    socket.on('chat_room_created', onRoomCreated);
    socket.on('chat_room_joined', onRoomJoined);
    socket.on('chat_new_message', onNewMessage);
    socket.on('chat_message_edited', onMessageEdited);
    socket.on('chat_message_unsent', onMessageUnsent);
    socket.on('chat_reaction_update', onReactionUpdate);
    socket.on('chat_typing_update', onTypingUpdate);
    socket.on('chat_member_update', onMemberUpdate);
    socket.on('chat_user_joined', onUserJoined);
    socket.on('chat_user_left', onUserLeft);

    return () => {
      socket.off('chat_room_created', onRoomCreated);
      socket.off('chat_room_joined', onRoomJoined);
      socket.off('chat_new_message', onNewMessage);
      socket.off('chat_message_edited', onMessageEdited);
      socket.off('chat_message_unsent', onMessageUnsent);
      socket.off('chat_reaction_update', onReactionUpdate);
      socket.off('chat_typing_update', onTypingUpdate);
      socket.off('chat_member_update', onMemberUpdate);
      socket.off('chat_user_joined', onUserJoined);
      socket.off('chat_user_left', onUserLeft);
    };
  }, [socket, dispatch, addSystemMessage]);
}

export function useChatActions() {
  const { socket } = useSocket();

  const createRoom = useCallback((displayName) => {
    socket?.emit('chat_create_room', { displayName });
  }, [socket]);

  const joinRoom = useCallback((roomCode, displayName) => {
    socket?.emit('chat_join_room', { roomCode, displayName });
  }, [socket]);

  const sendMessage = useCallback((roomCode, text, replyTo = null) => {
    socket?.emit('chat_send_message', { roomCode, text, type: 'text', replyTo });
  }, [socket]);

  const sendGif = useCallback((roomCode, gifUrl, replyTo = null) => {
    socket?.emit('chat_send_message', { roomCode, gifUrl, type: 'gif', replyTo });
  }, [socket]);

  const sendImage = useCallback((roomCode, imageUrl, replyTo = null) => {
    socket?.emit('chat_send_message', { roomCode, imageUrl, type: 'image', replyTo });
  }, [socket]);

  const editMessage = useCallback((roomCode, messageId, newText) => {
    socket?.emit('chat_edit_message', { roomCode, messageId, newText });
  }, [socket]);

  const unsendMessage = useCallback((roomCode, messageId) => {
    socket?.emit('chat_unsend_message', { roomCode, messageId });
  }, [socket]);

  const reactToMessage = useCallback((roomCode, messageId, emoji) => {
    socket?.emit('chat_react', { roomCode, messageId, emoji });
  }, [socket]);

  const sendTyping = useCallback((roomCode, isTyping) => {
    socket?.emit('chat_typing', { roomCode, isTyping });
  }, [socket]);

  const leaveRoom = useCallback((roomCode) => {
    socket?.emit('chat_leave_room', { roomCode });
  }, [socket]);

  return {
    createRoom, joinRoom, sendMessage, sendGif, sendImage,
    editMessage, unsendMessage, reactToMessage,
    sendTyping, leaveRoom,
  };
}
