import { useState, useCallback, useEffect } from "react";
import { socket } from "../../socket/socket";
import { useAuthStore } from "../../store/authStore";
import { useConversationDetails } from "../../hooks/useConversationDetails";
import type { Conversation } from "../../schemas/chat/conversationListResSchema";
import type { Message } from "../../schemas/chat/conversationDetailSchema";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ContactInfoPanel from "../common/ControlInfoPanel"; // ← ADD THIS

interface Props {
  conversation: Conversation;
  allConversations: Conversation[]; // ← ADD THIS
  onBack: () => void;
  registerAppend: (fn: (msg: any) => void) => void;
  registerStatusUpdate: (fn: (data: any) => void) => void;
  registerMsgUpdated: (fn: (data: any) => void) => void;
  registerMsgDeleted: (fn: (data: any) => void) => void;
  onMessageDeleted: (messageId: string, conversationId: string) => void;
  onMessageUpdated: (updatedMessage: Message) => void;
}

export default function ChatArea({
  conversation,
  allConversations, 
  onBack,
  registerAppend,
  registerStatusUpdate,
  registerMsgUpdated,
  registerMsgDeleted,
  onMessageDeleted,
  onMessageUpdated,
}: Props) {
  const myId = useAuthStore((s) => s.user?._id ?? "");
  const { messages: history, isLoading } = useConversationDetails(conversation._id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false); // ← ADD THIS

  // Seed messages from REST fetch
  useEffect(() => {
    if (!isLoading) setMessages(history);
  }, [isLoading, history]);

  // Close info panel when conversation changes
  useEffect(() => {
    setIsInfoOpen(false);
  }, [conversation._id]);

  // Join socket room when conversation opens
  useEffect(() => {
    if (socket.connected) {
      socket.emit("join_conversation", conversation._id);
    } else {
      function onConnect() {
        socket.emit("join_conversation", conversation._id);
      }
      socket.once("connect", onConnect);
      return () => { socket.off("connect", onConnect); };
    }
  }, [conversation._id]);

  const normalizeSender = useCallback(
    (msg: any): Message => {
      if (typeof msg.senderId === "object" && msg.senderId !== null) return msg as Message;
      const rawId = msg.senderId as string;
      const participant = conversation.participants.find((p) => p._id === rawId);
      const resolvedSender = participant
        ? { _id: participant._id, username: participant.username, profilePic: participant.profilePic }
        : { _id: rawId, username: "Unknown", profilePic: "" };
      return { ...msg, senderId: resolvedSender } as Message;
    },
    [conversation.participants]
  );

  const appendMessage = useCallback(
    (msg: any) => {
      if (msg.conversationId !== conversation._id) return;
      const normalized = normalizeSender(msg);
      setMessages((prev) => {
        if (prev.some((m) => m._id === normalized._id)) return prev;
        return [...prev, normalized];
      });
    },
    [conversation._id, normalizeSender]
  );
  useEffect(() => { registerAppend(appendMessage); }, [registerAppend, appendMessage]);

  const updateMessageStatus = useCallback(
    (data: { messageId: string; conversationId: string; statuses: any[] }) => {
      if (data.conversationId !== conversation._id) return;
      setMessages((prev) =>
        prev.map((msg) => (msg._id === data.messageId ? { ...msg, status: data.statuses } : msg))
      );
    },
    [conversation._id]
  );
  useEffect(() => { registerStatusUpdate(updateMessageStatus); }, [registerStatusUpdate, updateMessageStatus]);

  const handleSocketMsgUpdated = useCallback(
    (data: { messageId: string; conversationId: string; content: string; updatedMessage: any }) => {
      if (data.conversationId !== conversation._id) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id !== data.messageId
            ? msg
            : { ...msg, content: data.updatedMessage?.content ?? data.content }
        )
      );
    },
    [conversation._id]
  );
  useEffect(() => { registerMsgUpdated(handleSocketMsgUpdated); }, [registerMsgUpdated, handleSocketMsgUpdated]);

  const handleSocketMsgDeleted = useCallback(
    (data: { messageId: string; conversationId: string }) => {
      if (data.conversationId !== conversation._id) return;
      setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
    },
    [conversation._id]
  );
  useEffect(() => { registerMsgDeleted(handleSocketMsgDeleted); }, [registerMsgDeleted, handleSocketMsgDeleted]);

  const handleMessageDeleted = useCallback(
    (messageId: string) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      onMessageDeleted(messageId, conversation._id);
    },
    [conversation._id, onMessageDeleted]
  );

  const handleMessageUpdated = useCallback(
    (updatedMessage: Message) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
      );
      onMessageUpdated(updatedMessage);
    },
    [onMessageUpdated]
  );

  async function handleSend(content: string) {
    if (!content.trim() || !myId) return;
    setIsSending(true);
    try {
      socket.emit("send_message", {
        conversationId: conversation._id,
        senderId: myId,
        message: content,
      });
    } finally {
      setIsSending(false);
    }
  }

  function handleFileSent(serverMessage: any) {
    const normalized = normalizeSender(serverMessage);
    setMessages((prev) => {
      if (prev.some((m) => m._id === normalized._id)) return prev;
      return [...prev, normalized];
    });
    socket.emit("send_file_message", {
      conversationId: conversation._id,
      messageId: serverMessage._id,
    });
  }

  const displayName = conversation.isGroup
    ? (conversation.groupMetadata?.groupName ?? "Group")
    : (conversation.participants.find((p) => p._id !== myId)?.username ?? "");

  return (
    <div className="flex-1 flex min-h-0">
      {/* ── Main chat column ── */}
      <div className="flex-1 flex flex-col min-h-0 bg-neutral-50 dark:bg-neutral-950">
        <ChatHeader
          conversation={conversation}
          onBack={onBack}
          onOpenInfo={() => setIsInfoOpen((prev) => !prev)} // ← FIXED
          isInfoOpen={isInfoOpen}                           // ← FIXED
        />
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onMessageUpdated={handleMessageUpdated}
          onMessageDeleted={handleMessageDeleted}
        />
        <MessageInput
          recipientName={displayName}
          conversationId={conversation._id}
          isSending={isSending}
          onSend={handleSend}
          onFileSent={handleFileSent}
        />
      </div>

      {/* ── Contact info panel ── */}
      <ContactInfoPanel                          // ← ADDED
        conversation={conversation}
        allConversations={allConversations}
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </div>
  );
}