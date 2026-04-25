import { useEffect, useRef } from "react";
import { socket } from "../socket/socket";
import type { Message } from "../schemas/chat/conversationDetailSchema";

interface StatusChange {
  userId: string;
  isOnline: boolean;
}

interface StatusUpdate {
  messageId: string;
  conversationId: string;
  statuses: any[];
}

interface MessageUpdatedData {
  messageId: string;
  conversationId: string;
  content: string;
  updatedMessage: any;
}

interface MessageDeletedData {
  messageId: string;
  conversationId: string;
  newLastMessage: {
    _id: string;
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
}

interface Options {
  userId: string | undefined;
  onReceiveMessage: (message: Message) => void;
  onUserStatusChanged?: (change: StatusChange) => void;
  onNewChatRequest?: () => void;
  onConversationCreated?: () => void;
  onMessageStatusUpdate?: (data: StatusUpdate) => void;
  onGroupCreated?: () => void;
  onMessageUpdated?: (data: MessageUpdatedData) => void;
  onMessageDeleted?: (data: MessageDeletedData) => void;
}

export function useSocketConnection({
  userId,
  onReceiveMessage,
  onUserStatusChanged,
  onNewChatRequest,
  onConversationCreated,
  onMessageStatusUpdate,
  onGroupCreated,
  onMessageUpdated,
  onMessageDeleted,
}: Options) {
  const messageRef = useRef(onReceiveMessage);
  messageRef.current = onReceiveMessage;

  const statusRef = useRef(onUserStatusChanged);
  statusRef.current = onUserStatusChanged;

  const chatRequestRef = useRef(onNewChatRequest);
  chatRequestRef.current = onNewChatRequest;

  const convCreatedRef = useRef(onConversationCreated);
  convCreatedRef.current = onConversationCreated;

  const statusUpdateRef = useRef(onMessageStatusUpdate);
  statusUpdateRef.current = onMessageStatusUpdate;

  const groupCreatedRef = useRef(onGroupCreated);
  groupCreatedRef.current = onGroupCreated;

  const msgUpdatedRef = useRef(onMessageUpdated);
  msgUpdatedRef.current = onMessageUpdated;

  const msgDeletedRef = useRef(onMessageDeleted);
  msgDeletedRef.current = onMessageDeleted;

  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    if (!userId) return;

    // ── Event handlers ────────────────────────────────────────────────────
    function handleMessage(message: Message) { messageRef.current(message); }
    function handleStatusChange(change: StatusChange) { statusRef.current?.(change); }
    function handleNewChatRequest() { chatRequestRef.current?.(); }
    function handleConversationCreated() { convCreatedRef.current?.(); }
    function handleMessageStatusUpdate(data: StatusUpdate) { statusUpdateRef.current?.(data); }
    function handleGroupCreated() { groupCreatedRef.current?.(); }
    function handleMessageUpdated(data: MessageUpdatedData) { msgUpdatedRef.current?.(data); }
    function handleMessageDeleted(data: MessageDeletedData) { msgDeletedRef.current?.(data); }

    // ── Emit user_connected only after socket is confirmed connected ──────
    // This fixes the "WebSocket closed before established" error.
    // If socket is already connected, emit immediately.
    // Otherwise, wait for the "connect" event.
    function emitUserConnected() {
      if (userIdRef.current) {
        socket.emit("user_connected", userIdRef.current);
      }
    }

    socket.on("connect", emitUserConnected);
    socket.on("receive_message", handleMessage);
    socket.on("user_status_changed", handleStatusChange);
    socket.on("new_chat_request", handleNewChatRequest);
    socket.on("conversation_created", handleConversationCreated);
    socket.on("message_status_update", handleMessageStatusUpdate);
    socket.on("group_created", handleGroupCreated);
    socket.on("message_updated", handleMessageUpdated);
    socket.on("message_deleted", handleMessageDeleted);

    // Connect (or re-use existing connection)
    if (!socket.connected) {
      socket.connect();
    } else {
      // Already connected — emit immediately
      emitUserConnected();
    }

    return () => {
      socket.off("connect", emitUserConnected);
      socket.off("receive_message", handleMessage);
      socket.off("user_status_changed", handleStatusChange);
      socket.off("new_chat_request", handleNewChatRequest);
      socket.off("conversation_created", handleConversationCreated);
      socket.off("message_status_update", handleMessageStatusUpdate);
      socket.off("group_created", handleGroupCreated);
      socket.off("message_updated", handleMessageUpdated);
      socket.off("message_deleted", handleMessageDeleted);
      // Note: do NOT disconnect here — logout handles that
    };
  }, [userId]);
}