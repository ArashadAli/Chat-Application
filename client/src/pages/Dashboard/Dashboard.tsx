import { useState, useCallback, useRef, useEffect } from "react";
import { socket } from "../../socket/socket";
import { useAuthStore } from "../../store/authStore";
import { useSocketConnection } from "../../hooks/useSocketConnection";
import { useConversationDetails } from "../../hooks/useConversationDetails";
import { useConversations } from "../../hooks/useConversation";
import { useChatRequests } from "../../hooks/useChatRequest";
import type { Conversation } from "../../schemas/chat/conversationListResSchema";
import type { Message } from "../../schemas/chat/conversationDetailSchema";
import Sidebar from "../../components/chat/Sidebar";
import MessageList from "../../components/chat/MessageList";
import MessageInput from "../../components/chat/MessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Phone, Video, MoreVertical, MessageCircle, Users } from "lucide-react";

const ACTIVE_CONV_KEY = "active_conversation_id";

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 select-none gap-4 px-6">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-neutral-200 dark:border-neutral-800 animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-3 rounded-full border border-neutral-100 dark:border-neutral-800/60" />
        <MessageCircle className="w-7 h-7 text-neutral-300 dark:text-neutral-700" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Select a conversation</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-600 max-w-[200px] leading-relaxed">
          Pick someone from the sidebar to start messaging.
        </p>
      </div>
    </div>
  );
}

interface ChatAreaProps {
  conversation: Conversation;
  onBack: () => void;
  registerAppend: (fn: (msg: any) => void) => void;
  registerStatusUpdate: (fn: (data: any) => void) => void;
}

function ChatArea({ conversation, onBack, registerAppend, registerStatusUpdate }: ChatAreaProps) {
  const myId = useAuthStore((s) => s.user?._id ?? "");
  const { messages: history, isLoading } = useConversationDetails(conversation._id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  const isGroup = conversation.isGroup;

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
      setMessages((prev) => [...prev, normalized]);
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
      socket.emit("send_message", { conversationId: conversation._id, senderId: myId, message: content });
    } finally {
      setIsSending(false);
    }
  }

  // For DM — the other participant
  const other = !isGroup
    ? (conversation.participants.find((p) => p._id !== myId) ?? conversation.participants[0])
    : null;

  // For group
  const groupName = conversation.groupMetadata?.groupName ?? "Group";
  const groupMemberCount = conversation.participants.length;

  function avatarGradient(name: string) {
    const palette = ["from-rose-400 to-pink-500", "from-emerald-400 to-teal-500", "from-sky-400 to-blue-500", "from-violet-400 to-purple-500"];
    let h = 0;
    for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
    return palette[h % palette.length];
  }

  const headerName = isGroup ? groupName : (other?.username ?? "");
  const headerSubtitle = isGroup
    ? `${groupMemberCount} members`
    : (other?.isOnline ? "Online" : "Offline");
  const headerSubtitleColor = isGroup
    ? "text-neutral-400 dark:text-neutral-500"
    : (other?.isOnline ? "text-emerald-500" : "text-neutral-400 dark:text-neutral-500");

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-neutral-50 dark:bg-neutral-950">
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 -ml-1 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <div className="relative shrink-0">
          {isGroup ? (
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(groupName)} flex items-center justify-center ring-2 ring-white dark:ring-neutral-900`}>
              <Users className="w-4 h-4 text-white" />
            </div>
          ) : (
            <>
              <Avatar className="w-9 h-9 ring-2 ring-white dark:ring-neutral-900">
                <AvatarImage src={other?.profilePic} alt={other?.username} />
                <AvatarFallback className={`bg-gradient-to-br ${avatarGradient(other?.username ?? "")} text-white text-xs font-bold`}>
                  {(other?.username ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-neutral-900 ${other?.isOnline ? "bg-emerald-400" : "bg-neutral-300 dark:bg-neutral-600"}`} />
            </>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-neutral-900 dark:text-white truncate leading-snug">{headerName}</p>
          <p className={`text-xs font-medium leading-none mt-0.5 ${headerSubtitleColor}`}>{headerSubtitle}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isGroup && (
            <>
              <button className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <Video className="w-4 h-4" />
              </button>
            </>
          )}
          <button className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <MessageList messages={messages} isLoading={isLoading} />
      <MessageInput recipientName={headerName} isSending={isSending} onSend={handleSend} />
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { conversations, setConversations, refetch: refetchConversations } = useConversations();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const chatRequests = useChatRequests(refetchConversations);

  useEffect(() => {
    if (conversations.length === 0) return;
    const savedId = localStorage.getItem(ACTIVE_CONV_KEY);
    if (savedId && !activeConversation) {
      const found = conversations.find((c) => c._id === savedId);
      if (found) setActiveConversation(found);
    }
  }, [conversations]);

  function handleSelectConversation(conv: Conversation) {
    localStorage.setItem(ACTIVE_CONV_KEY, conv._id);
    appendRef.current = null;
    statusUpdateRef.current = null;
    setActiveConversation(conv);
    setConversations((prev) => prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c)));
  }

  function handleBack() {
    localStorage.removeItem(ACTIVE_CONV_KEY);
    appendRef.current = null;
    statusUpdateRef.current = null;
    setActiveConversation(null);
  }

  const appendRef = useRef<((msg: any) => void) | null>(null);
  const statusUpdateRef = useRef<((data: any) => void) | null>(null);
  const activeConversationRef = useRef<Conversation | null>(null);
  activeConversationRef.current = activeConversation;

  const handleReceiveMessage = useCallback(
    (message: any) => {
      appendRef.current?.(message);
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === message.conversationId);
        if (!exists) { refetchConversations(); return prev; }

        const updated = prev.map((c) => {
          if (c._id !== message.conversationId) return c;
          const isOpen = activeConversationRef.current?._id === message.conversationId;
          return {
            ...c,
            lastMessage: {
              _id: message._id ?? "",
              content: message.content,
              senderId: typeof message.senderId === "object" ? message.senderId._id : message.senderId,
              createdAt: message.createdAt ?? new Date().toISOString(),
            },
            unreadCount: isOpen ? 0 : c.unreadCount + 1,
          };
        });

        const targetIndex = updated.findIndex((c) => c._id === message.conversationId);
        if (targetIndex > 0) {
          const [target] = updated.splice(targetIndex, 1);
          updated.unshift(target);
        }
        return updated;
      });
    },
    [setConversations, refetchConversations]
  );

  const handleUserStatusChanged = useCallback(
    ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      setConversations((prev) =>
        prev.map((conv) => ({
          ...conv,
          participants: conv.participants.map((p) => (p._id === userId ? { ...p, isOnline } : p)),
        }))
      );
      setActiveConversation((prev) => {
        if (!prev) return prev;
        return { ...prev, participants: prev.participants.map((p) => (p._id === userId ? { ...p, isOnline } : p)) };
      });
    },
    [setConversations]
  );

  const handleNewChatRequest = useCallback(() => {
    chatRequests.fetchRequests();
  }, [chatRequests.fetchRequests]);

  const handleConversationCreated = useCallback(() => {
    refetchConversations();
  }, [refetchConversations]);

  const handleMessageStatusUpdate = useCallback((data: any) => {
    statusUpdateRef.current?.(data);
  }, []);

  // Group created — all participants refetch their conversations
  const handleGroupCreated = useCallback(() => {
    refetchConversations();
  }, [refetchConversations]);

  useSocketConnection({
    userId: user?._id,
    onReceiveMessage: handleReceiveMessage,
    onUserStatusChanged: handleUserStatusChanged,
    onNewChatRequest: handleNewChatRequest,
    onConversationCreated: handleConversationCreated,
    onMessageStatusUpdate: handleMessageStatusUpdate,
    onGroupCreated: handleGroupCreated,
  });

  const registerAppend = useCallback((fn: (msg: any) => void) => { appendRef.current = fn; }, []);
  const registerStatusUpdate = useCallback((fn: (data: any) => void) => { statusUpdateRef.current = fn; }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-neutral-900">
      <div className={`${activeConversation ? "hidden md:flex" : "flex"} w-full md:w-72 xl:w-80 shrink-0 flex-col h-full`}>
        <Sidebar
          activeConversationId={activeConversation?._id ?? null}
          onSelectConversation={handleSelectConversation}
          conversations={conversations}
          setConversations={setConversations}
          isConvLoading={false}
          refetchConversations={refetchConversations}
          chatRequests={chatRequests}
        />
      </div>

      <div className={`${activeConversation ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0 h-full`}>
        {activeConversation ? (
          <ChatArea
            key={activeConversation._id}
            conversation={activeConversation}
            onBack={handleBack}
            registerAppend={registerAppend}
            registerStatusUpdate={registerStatusUpdate}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}