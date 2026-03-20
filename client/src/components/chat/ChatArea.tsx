import { useState, useCallback, useEffect } from "react";
import { socket } from "../../socket/socket";
import { useAuthStore } from "../../store/authStore";
import { useConversationDetails } from "../../hooks/useConversationDetails";
import type { Conversation } from "../../schemas/chat/conversationListResSchema";
import type { Message } from "../../schemas/chat/conversationDetailSchema";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

interface Props {
  conversation: Conversation;
  onBack: () => void;
  registerAppend: (fn: (msg: any) => void) => void;
  registerStatusUpdate: (fn: (data: any) => void) => void;
}

export default function ChatArea({ conversation, onBack, registerAppend, registerStatusUpdate }: Props) {
  const myId = useAuthStore((s) => s.user?._id ?? "");
  const { messages: history, isLoading } = useConversationDetails(conversation._id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isLoading) setMessages(history);
  }, [isLoading]);

  useEffect(() => {
    socket.emit("join_conversation", conversation._id);
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
        // Deduplicate by _id
        if (prev.some((m) => m._id === normalized._id)) return prev;
        return [...prev, normalized];
      });
    },
    [conversation._id, normalizeSender]
  );

  useEffect(() => {
    registerAppend(appendMessage);
  }, [registerAppend, appendMessage]);

  const updateMessageStatus = useCallback(
    (data: { messageId: string; conversationId: string; statuses: any[] }) => {
      if (data.conversationId !== conversation._id) return;
      setMessages((prev) =>
        prev.map((msg) => (msg._id === data.messageId ? { ...msg, status: data.statuses } : msg))
      );
    },
    [conversation._id]
  );

  useEffect(() => {
    registerStatusUpdate(updateMessageStatus);
  }, [registerStatusUpdate, updateMessageStatus]);

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

  // Called after a file is successfully uploaded — add to message list immediately
  function handleFileSent(serverMessage: any) {
    const normalized = normalizeSender(serverMessage);
    setMessages((prev) => {
      if (prev.some((m) => m._id === normalized._id)) return prev;
      return [...prev, normalized];
    });

    // Also notify other participants via socket that a new file message exists
    socket.emit("send_file_message", {
      conversationId: conversation._id,
      messageId: serverMessage._id,
    });
  }

  const other = !conversation.isGroup
    ? (conversation.participants.find((p) => p._id !== myId) ?? conversation.participants[0])
    : null;

  const displayName = conversation.isGroup
    ? (conversation.groupMetadata?.groupName ?? "Group")
    : (other?.username ?? "");

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-neutral-50 dark:bg-neutral-950">
      <ChatHeader conversation={conversation} onBack={onBack} />
      <MessageList messages={messages} isLoading={isLoading} />
      <MessageInput
        recipientName={displayName}
        conversationId={conversation._id}
        isSending={isSending}
        onSend={handleSend}
        onFileSent={handleFileSent}
      />
    </div>
  );
}