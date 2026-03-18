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

interface Options {
  userId: string | undefined;
  onReceiveMessage: (message: Message) => void;
  onUserStatusChanged?: (change: StatusChange) => void;
  onNewChatRequest?: () => void;
  onConversationCreated?: () => void;
  onMessageStatusUpdate?: (data: StatusUpdate) => void;
  onGroupCreated?: () => void;
}

export function useSocketConnection({
  userId,
  onReceiveMessage,
  onUserStatusChanged,
  onNewChatRequest,
  onConversationCreated,
  onMessageStatusUpdate,
  onGroupCreated,
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

  useEffect(() => {
    if (!userId) return;

    if (!socket.connected) socket.connect();
    socket.emit("user_connected", userId);

    function handleMessage(message: Message) {
      messageRef.current(message);
    }
    function handleStatusChange(change: StatusChange) {
      statusRef.current?.(change);
    }
    function handleNewChatRequest() {
      chatRequestRef.current?.();
    }
    function handleConversationCreated() {
      convCreatedRef.current?.();
    }
    function handleMessageStatusUpdate(data: StatusUpdate) {
      statusUpdateRef.current?.(data);
    }
    function handleGroupCreated() {
      groupCreatedRef.current?.();
    }

    socket.on("receive_message", handleMessage);
    socket.on("user_status_changed", handleStatusChange);
    socket.on("new_chat_request", handleNewChatRequest);
    socket.on("conversation_created", handleConversationCreated);
    socket.on("message_status_update", handleMessageStatusUpdate);
    socket.on("group_created", handleGroupCreated);

    return () => {
      socket.off("receive_message", handleMessage);
      socket.off("user_status_changed", handleStatusChange);
      socket.off("new_chat_request", handleNewChatRequest);
      socket.off("conversation_created", handleConversationCreated);
      socket.off("message_status_update", handleMessageStatusUpdate);
      socket.off("group_created", handleGroupCreated);
    };
  }, [userId]);
}