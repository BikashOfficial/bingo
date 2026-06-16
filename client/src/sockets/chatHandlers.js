import { useEffect, useCallback, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useChat } from "../context/ChatContext";
import {
  getOrCreateKeyPair,
  encryptMessage,
  decryptMessage,
  encryptKeyForMember,
  decryptKeyWithPrivateKey,
  decryptWithAesKey
} from "../utils/crypto";

// Memory storage for message keys (messageId -> aesJwk)
const messageKeys = new Map();

export function useChatListeners() {
  const { socket, connected } = useSocket();
  const { state, dispatch, addSystemMessage } = useChat();
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ── Auto-Rejoin on socket reconnect or ID mismatch ──
  useEffect(() => {
    if (!socket || !connected) return;
    const { roomCode, me } = state;
    if (!roomCode || !me?.displayName) return;

    if (me.socketId !== socket.id) {
      console.log(`[Chat] Auto-rejoining room ${roomCode} as ${me.displayName} (socket ID mismatch: local=${socket.id}, state=${me.socketId})`);
      
      const doRejoin = async () => {
        try {
          const keys = await getOrCreateKeyPair();
          const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keys.publicKey);
          socket.emit("chat_join_room", {
            roomCode,
            displayName: me.displayName,
            publicKey: publicKeyJwk,
          });
        } catch (err) {
          socket.emit("chat_join_room", {
            roomCode,
            displayName: me.displayName,
          });
          console.warn("[Chat] Reconnected without public key:", err);
        }
      };
      
      doRejoin();
    }
  }, [socket, connected, state.roomCode, state.me?.socketId]);

  useEffect(() => {
    if (!socket) return;

    const decryptMsg = async (msg, myName) => {
      if (!msg || msg.type === "system" || msg.unsent) return msg;
      if (!msg.ciphertext || !msg.iv || !msg.encryptedKeys) return msg;
      try {
        const keys = await getOrCreateKeyPair();
        const result = await decryptMessage(msg, keys.privateKey, myName);
        if (result && result.payload) {
          // Store the key in memory for future sharing with later-joined users
          messageKeys.set(msg.id, result.aesJwk);
          const decrypted = result.payload;
          return {
            ...msg,
            text: decrypted.text,
            gifUrl: decrypted.gifUrl,
            imageUrl: decrypted.imageUrl,
            replyTo: decrypted.replyTo,
            decryptionFailed: false
          };
        }
      } catch (err) {
        console.warn("[E2EE] Decryption failed for message:", msg.id, err);
      }
      return {
        ...msg,
        text: "🔒 [Encrypted Message]",
        gifUrl: null,
        imageUrl: null,
        replyTo: null,
        decryptionFailed: true,
      };
    };

    const onRoomCreated = ({ roomCode, member, members }) => {
      messageKeys.clear();
      dispatch({
        type: "SET_ROOM",
        payload: { roomCode, member, members, messages: [] },
      });
    };

    const onRoomJoined = async ({ roomCode, member, members, messages }) => {
      // Only clear keys when entering a brand new room, not on reconnect
      const isNewRoom = stateRef.current.roomCode !== roomCode;
      if (isNewRoom) messageKeys.clear();
      const decryptedMessages = await Promise.all(
        messages.map((m) => decryptMsg(m, member.displayName)),
      );
      dispatch({
        type: "SET_ROOM",
        payload: { roomCode, member, members, messages: decryptedMessages },
      });
    };

    const onNewMessage = async ({ message }) => {
      const myName = stateRef.current.me?.displayName;
      const decrypted = await decryptMsg(message, myName);
      dispatch({ type: "ADD_MESSAGE", payload: decrypted });
    };

    const onMessageEdited = async ({
      messageId,
      ciphertext,
      iv,
      encryptedKeys,
      editedAt,
    }) => {
      const myName = stateRef.current.me?.displayName;
      const dummyMsg = { ciphertext, iv, encryptedKeys };
      const decrypted = await decryptMsg(dummyMsg, myName);
      dispatch({
        type: "EDIT_MESSAGE",
        payload: { messageId, newText: decrypted.text, editedAt },
      });
    };

    const onMessageUnsent = ({ messageId }) => {
      dispatch({ type: "UNSEND_MESSAGE", payload: { messageId } });
    };

    const onReactionUpdate = ({ messageId, reactions }) => {
      dispatch({ type: "REACTION_UPDATE", payload: { messageId, reactions } });
    };

    const onTypingUpdate = ({ displayName, isTyping }) => {
      dispatch({ type: "TYPING_UPDATE", payload: { displayName, isTyping } });
    };

    const onMemberUpdate = ({ members }) => {
      dispatch({ type: "MEMBER_UPDATE", payload: members });
    };

    const onUserJoined = async ({ member, members, systemMessage }) => {
      dispatch({ type: "MEMBER_UPDATE", payload: members });
      if (systemMessage) addSystemMessage(systemMessage);

      // Check if we are the primary (first) active member in the room list
      const isPrimary = stateRef.current.members[0]?.displayName === stateRef.current.me?.displayName;
      if (!isPrimary) return;

      // Encrypt and share history message keys with the joining user
      if (member.publicKey && member.socketId !== socket.id) {
        console.log(`[E2EE] Sharing ${messageKeys.size} history keys with new member ${member.displayName}...`);
        const sharedKeys = {};
        for (const [msgId, aesJwk] of messageKeys.entries()) {
          try {
            const encryptedKey = await encryptKeyForMember(aesJwk, member.publicKey);
            sharedKeys[msgId] = encryptedKey;
          } catch (err) {
            console.warn(`[E2EE] Failed to encrypt key for message ${msgId}:`, err);
          }
        }
        socket.emit("chat_share_history_keys", {
          roomCode: stateRef.current.roomCode,
          targetSocketId: member.socketId,
          encryptedKeys: sharedKeys
        });
      }
    };

    const onUserLeft = ({ displayName, members, systemMessage }) => {
      dispatch({ type: "USER_LEFT", payload: { members } });
      if (systemMessage) addSystemMessage(systemMessage);
    };

    const onReceiveHistoryKeys = async ({ encryptedKeys }) => {
      console.log("[E2EE] Received shared history keys. Decrypting locked messages...");
      try {
        const keys = await getOrCreateKeyPair();
        const updatedMessages = await Promise.all(
          stateRef.current.messages.map(async (msg) => {
            if (!msg.ciphertext || !msg.iv || msg.decryptionFailed === false) return msg;
            const encryptedKeyB64 = encryptedKeys[msg.id];
            if (!encryptedKeyB64) return msg;
            try {
              const aesJwk = await decryptKeyWithPrivateKey(encryptedKeyB64, keys.privateKey);
              // Store key in memory for future joins
              messageKeys.set(msg.id, aesJwk);
              const decrypted = await decryptWithAesKey(msg.ciphertext, msg.iv, aesJwk);
              return {
                ...msg,
                text: decrypted.text,
                gifUrl: decrypted.gifUrl,
                imageUrl: decrypted.imageUrl,
                replyTo: decrypted.replyTo,
                decryptionFailed: false
              };
            } catch (err) {
              console.warn(`[E2EE] Failed to decrypt shared key for message ${msg.id}:`, err);
              return msg;
            }
          })
        );
        dispatch({ type: "UPDATE_MESSAGES", payload: updatedMessages });
      } catch (err) {
        console.error("[E2EE] Failed to process shared history keys:", err);
      }
    };

    socket.on("chat_room_created", onRoomCreated);
    socket.on("chat_room_joined", onRoomJoined);
    socket.on("chat_new_message", onNewMessage);
    socket.on("chat_message_edited", onMessageEdited);
    socket.on("chat_message_unsent", onMessageUnsent);
    socket.on("chat_reaction_update", onReactionUpdate);
    socket.on("chat_typing_update", onTypingUpdate);
    socket.on("chat_member_update", onMemberUpdate);
    socket.on("chat_user_joined", onUserJoined);
    socket.on("chat_user_left", onUserLeft);
    socket.on("chat_receive_history_keys", onReceiveHistoryKeys);

    return () => {
      socket.off("chat_room_created", onRoomCreated);
      socket.off("chat_room_joined", onRoomJoined);
      socket.off("chat_new_message", onNewMessage);
      socket.off("chat_message_edited", onMessageEdited);
      socket.off("chat_message_unsent", onMessageUnsent);
      socket.off("chat_reaction_update", onReactionUpdate);
      socket.off("chat_typing_update", onTypingUpdate);
      socket.off('chat_member_update', onMemberUpdate);
      socket.off("chat_user_joined", onUserJoined);
      socket.off("chat_user_left", onUserLeft);
      socket.off("chat_receive_history_keys", onReceiveHistoryKeys);
    };
  }, [socket, dispatch, addSystemMessage]);
}

export function useChatActions() {
  const { socket } = useSocket();
  const { state } = useChat();

  const createRoom = useCallback(
    (displayName, publicKey) => {
      socket?.emit("chat_create_room", { displayName, publicKey });
    },
    [socket],
  );

  const joinRoom = useCallback(
    (roomCode, displayName, publicKey) => {
      socket?.emit("chat_join_room", { roomCode, displayName, publicKey });
    },
    [socket],
  );

  const sendMessage = useCallback(
    async (roomCode, text, replyTo = null) => {
      if (!socket || !state.members) return;
      try {
        const payload = { text, replyTo };
        const encrypted = await encryptMessage(payload, state.members);
        socket.emit("chat_send_message", {
          roomCode,
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          encryptedKeys: encrypted.encryptedKeys,
          type: "text",
        });
      } catch (err) {
        console.error("[E2EE] Encryption failed for text message:", err);
      }
    },
    [socket, state.members],
  );

  const sendGif = useCallback(
    async (roomCode, gifUrl, replyTo = null) => {
      if (!socket || !state.members) return;
      try {
        const payload = { gifUrl, replyTo };
        const encrypted = await encryptMessage(payload, state.members);
        socket.emit("chat_send_message", {
          roomCode,
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          encryptedKeys: encrypted.encryptedKeys,
          type: "gif",
        });
      } catch (err) {
        console.error("[E2EE] Encryption failed for GIF:", err);
      }
    },
    [socket, state.members],
  );

  const sendImage = useCallback(
    async (roomCode, imageUrl, replyTo = null) => {
      if (!socket || !state.members) return;
      try {
        const payload = { imageUrl, replyTo };
        const encrypted = await encryptMessage(payload, state.members);
        socket.emit("chat_send_message", {
          roomCode,
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          encryptedKeys: encrypted.encryptedKeys,
          type: "image",
        });
      } catch (err) {
        console.error("[E2EE] Encryption failed for image:", err);
      }
    },
    [socket, state.members],
  );

  const editMessage = useCallback(
    async (roomCode, messageId, newText) => {
      if (!socket || !state.members) return;
      try {
        const payload = { text: newText };
        const encrypted = await encryptMessage(payload, state.members);
        socket.emit("chat_edit_message", {
          roomCode,
          messageId,
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          encryptedKeys: encrypted.encryptedKeys,
        });
      } catch (err) {
        console.error("[E2EE] Encryption failed for message edit:", err);
      }
    },
    [socket, state.members],
  );

  const unsendMessage = useCallback(
    (roomCode, messageId) => {
      socket?.emit("chat_unsend_message", { roomCode, messageId });
    },
    [socket],
  );

  const reactToMessage = useCallback(
    (roomCode, messageId, emoji) => {
      socket?.emit("chat_react", { roomCode, messageId, emoji });
    },
    [socket],
  );

  const sendTyping = useCallback(
    (roomCode, isTyping) => {
      socket?.emit("chat_typing", { roomCode, isTyping });
    },
    [socket],
  );

  const leaveRoom = useCallback(
    (roomCode) => {
      socket?.emit("chat_leave_room", { roomCode });
    },
    [socket],
  );

  return {
    createRoom,
    joinRoom,
    sendMessage,
    sendGif,
    sendImage,
    editMessage,
    unsendMessage,
    reactToMessage,
    sendTyping,
    leaveRoom,
  };
}
