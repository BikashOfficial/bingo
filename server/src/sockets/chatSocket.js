const { generateRoomCode } = require('../utils/roomCode');

/**
 * Ephemeral in-memory chat room store.
 * All data is lost when the process restarts or room empties.
 */
const chatRooms = new Map();

const ChatStore = {
  get: (code) => chatRooms.get(code) || null,
  set: (code, room) => chatRooms.set(code, room),
  delete: (code) => chatRooms.delete(code),
  has: (code) => chatRooms.has(code),
  findBySocket: (socketId) => {
    for (const room of chatRooms.values()) {
      if (room.members.some((m) => m.socketId === socketId)) return room;
    }
    return null;
  },
};

/**
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function registerChatHandlers(io, socket) {
  // ─── CREATE CHAT ROOM ────────────────────────────────────────────────────────
  socket.on('chat_create_room', ({ displayName }) => {
    try {
      if (!displayName || !displayName.trim()) {
        socket.emit('chat_error', { message: 'Display name is required.' });
        return;
      }

      let roomCode;
      do {
        roomCode = generateRoomCode();
      } while (ChatStore.has(roomCode));

      const member = {
        socketId: socket.id,
        displayName: displayName.trim(),
        avatar: getAvatar(displayName.trim()),
        joinedAt: Date.now(),
      };

      const room = {
        roomCode,
        members: [member],
        messages: [],
        createdAt: Date.now(),
      };

      ChatStore.set(roomCode, room);
      socket.join(roomCode);
      socket.data.chatRoom = roomCode;
      socket.data.displayName = displayName.trim();

      socket.emit('chat_room_created', {
        roomCode,
        member,
        members: room.members,
      });

      console.log(`[Chat] Room ${roomCode} created by ${displayName}`);
    } catch (err) {
      console.error('[chat_create_room error]', err);
      socket.emit('chat_error', { message: 'Failed to create room.' });
    }
  });

  // ─── JOIN CHAT ROOM ──────────────────────────────────────────────────────────
  socket.on('chat_join_room', ({ roomCode, displayName }) => {
    try {
      const code = (roomCode || '').toUpperCase().trim();

      if (!displayName || !displayName.trim()) {
        socket.emit('chat_error', { message: 'Display name is required.' });
        return;
      }

      const room = ChatStore.get(code);
      if (!room) {
        socket.emit('chat_error', { type: 'not_found', message: 'Room not found. Check the code and try again.' });
        return;
      }

      // Check if user is rejoining (same display name)
      const existing = room.members.find(
        (m) => m.displayName === displayName.trim()
      );
      if (existing) {
        existing.socketId = socket.id;
        socket.join(code);
        socket.data.chatRoom = code;
        socket.data.displayName = displayName.trim();

        socket.emit('chat_room_joined', {
          roomCode: code,
          member: existing,
          members: room.members,
          messages: room.messages,
        });

        io.to(code).emit('chat_member_update', { members: room.members });
        return;
      }

      const member = {
        socketId: socket.id,
        displayName: displayName.trim(),
        avatar: getAvatar(displayName.trim()),
        joinedAt: Date.now(),
      };

      room.members.push(member);
      socket.join(code);
      socket.data.chatRoom = code;
      socket.data.displayName = displayName.trim();

      // Send full history to the new member
      socket.emit('chat_room_joined', {
        roomCode: code,
        member,
        members: room.members,
        messages: room.messages,
      });

      // Notify everyone else
      socket.to(code).emit('chat_user_joined', {
        member,
        members: room.members,
        systemMessage: `${member.displayName} joined the room 👋`,
      });

      console.log(`[Chat] ${displayName} joined room ${code}`);
    } catch (err) {
      console.error('[chat_join_room error]', err);
      socket.emit('chat_error', { message: 'Failed to join room.' });
    }
  });

  // ─── SEND MESSAGE ────────────────────────────────────────────────────────────
  socket.on('chat_send_message', ({ roomCode, text, replyTo, type = 'text', gifUrl }) => {
    try {
      const room = ChatStore.get(roomCode);
      if (!room) return;

      const member = room.members.find((m) => m.socketId === socket.id);
      if (!member) return;

      const message = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        senderId: socket.id,
        senderName: member.displayName,
        senderAvatar: member.avatar,
        text: type === 'text' ? (text || '').slice(0, 1000) : '',
        gifUrl: type === 'gif' ? gifUrl : null,
        type, // 'text' | 'gif' | 'sticker'
        replyTo: replyTo || null, // { id, senderName, text }
        reactions: {}, // { emoji: [displayName, ...] }
        edited: false,
        unsent: false,
        timestamp: Date.now(),
      };

      room.messages.push(message);
      // Keep last 500 messages in memory
      if (room.messages.length > 500) room.messages.shift();

      io.to(roomCode).emit('chat_new_message', { message });
    } catch (err) {
      console.error('[chat_send_message error]', err);
    }
  });

  // ─── EDIT MESSAGE ────────────────────────────────────────────────────────────
  socket.on('chat_edit_message', ({ roomCode, messageId, newText }) => {
    try {
      const room = ChatStore.get(roomCode);
      if (!room) return;

      const member = room.members.find((m) => m.socketId === socket.id);
      if (!member) return;

      const message = room.messages.find((m) => m.id === messageId);
      if (!message || message.senderName !== member.displayName) return;
      if (message.unsent) return;

      message.text = (newText || '').slice(0, 1000);
      message.edited = true;
      message.editedAt = Date.now();

      io.to(roomCode).emit('chat_message_edited', {
        messageId,
        newText: message.text,
        editedAt: message.editedAt,
      });
    } catch (err) {
      console.error('[chat_edit_message error]', err);
    }
  });

  // ─── UNSEND MESSAGE ──────────────────────────────────────────────────────────
  socket.on('chat_unsend_message', ({ roomCode, messageId }) => {
    try {
      const room = ChatStore.get(roomCode);
      if (!room) return;

      const member = room.members.find((m) => m.socketId === socket.id);
      if (!member) return;

      const message = room.messages.find((m) => m.id === messageId);
      if (!message || message.senderName !== member.displayName) return;

      message.unsent = true;
      message.text = '';
      message.gifUrl = null;

      io.to(roomCode).emit('chat_message_unsent', { messageId });
    } catch (err) {
      console.error('[chat_unsend_message error]', err);
    }
  });

  // ─── REACTION ────────────────────────────────────────────────────────────────
  socket.on('chat_react', ({ roomCode, messageId, emoji }) => {
    try {
      const room = ChatStore.get(roomCode);
      if (!room) return;

      const member = room.members.find((m) => m.socketId === socket.id);
      if (!member) return;

      const message = room.messages.find((m) => m.id === messageId);
      if (!message || message.unsent) return;

      if (!message.reactions) message.reactions = {};
      if (!message.reactions[emoji]) message.reactions[emoji] = [];

      const idx = message.reactions[emoji].indexOf(member.displayName);
      if (idx === -1) {
        // Add reaction
        message.reactions[emoji].push(member.displayName);
      } else {
        // Toggle off
        message.reactions[emoji].splice(idx, 1);
        if (message.reactions[emoji].length === 0) {
          delete message.reactions[emoji];
        }
      }

      io.to(roomCode).emit('chat_reaction_update', {
        messageId,
        reactions: message.reactions,
      });
    } catch (err) {
      console.error('[chat_react error]', err);
    }
  });

  // ─── TYPING ──────────────────────────────────────────────────────────────────
  socket.on('chat_typing', ({ roomCode, isTyping }) => {
    try {
      const room = ChatStore.get(roomCode);
      if (!room) return;

      const member = room.members.find((m) => m.socketId === socket.id);
      if (!member) return;

      socket.to(roomCode).emit('chat_typing_update', {
        displayName: member.displayName,
        isTyping,
      });
    } catch (err) {
      console.error('[chat_typing error]', err);
    }
  });

  // ─── LEAVE ROOM ──────────────────────────────────────────────────────────────
  socket.on('chat_leave_room', ({ roomCode }) => {
    _handleLeave(io, socket, roomCode);
  });

  // ─── DISCONNECT ──────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const roomCode = socket.data.chatRoom;
    if (roomCode) {
      _handleLeave(io, socket, roomCode);
    }
  });
}

function _handleLeave(io, socket, roomCode) {
  try {
    const room = ChatStore.get(roomCode);
    if (!room) return;

    const memberIdx = room.members.findIndex((m) => m.socketId === socket.id);
    if (memberIdx === -1) return;

    const member = room.members[memberIdx];
    room.members.splice(memberIdx, 1);
    socket.leave(roomCode);

    if (room.members.length === 0) {
      ChatStore.delete(roomCode);
      console.log(`[Chat] Room ${roomCode} deleted (empty)`);
    } else {
      io.to(roomCode).emit('chat_user_left', {
        displayName: member.displayName,
        members: room.members,
        systemMessage: `${member.displayName} left the room`,
      });
    }
  } catch (err) {
    console.error('[chat_leave error]', err);
  }
}

/** Generate a consistent color avatar letter */
function getAvatar(name) {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#06b6d4',
    '#3b82f6', '#a855f7',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return { letter: name[0].toUpperCase(), color: colors[idx] };
}

module.exports = { registerChatHandlers };
