import { useState, useCallback, useRef, useEffect } from "react";
import { socket } from "../../socket/socket";
import { useAuthStore } from "../../store/authStore";
import { useSocketConnection } from "../../hooks/useSocketConnection";
import { useConversationDetails } from "../../hooks/useConversationDetails";
import { useConversations } from "../../hooks/useConversation";
import type { Conversation } from "../../schemas/chat/conversationListResSchema";
import type { Message } from "../../schemas/chat/conversationDetailSchema";
import Sidebar from "../../components/chat/Sidebar";
import MessageList from "../../components/chat/MessageList";
import MessageInput from "../../components/chat/MessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Phone, Video, MoreVertical, MessageCircle } from "lucide-react";

const ACTIVE_CONV_KEY = "active_conversation_id";

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 select-none gap-4 px-6">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-neutral-200 dark:border-neutral-800 animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-3 rounded-full border border-neutral-100 dark:border-neutral-800/60" />
        <MessageCircle className="w-7 h-7 text-neutral-300 dark:text-neutral-700" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
          Select a conversation
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-600 max-w-[200px] leading-relaxed">
          Pick someone from the sidebar to start messaging.
        </p>
      </div>
    </div>
  );
}

// ── Chat area ─────────────────────────────────────────────────────────────────

interface ChatAreaProps {
  conversation: Conversation;
  onBack: () => void;
  registerAppend: (fn: (msg: any) => void) => void;
}

function ChatArea({ conversation, onBack, registerAppend }: ChatAreaProps) {
  const myId = useAuthStore((s) => s.user?._id ?? "");

  // 1. Fetch message history from REST API (senderId is populated object here)
  const { messages: history, isLoading } = useConversationDetails(conversation._id);


  // 2. Local real-time state — seeded from API history
  const [messages, setMessages] = useState<Message[]>([]);

  // FIX 1: Seed messages whenever API finishes loading.
  // Do NOT use seededRef — when key changes (conversation switch) this component
  // remounts fresh, so isLoading going false always means "fresh data ready".
  useEffect(() => {
    if (!isLoading) {
      setMessages(history);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // 3. Join socket room for this conversation
  useEffect(() => {
    socket.emit("join_conversation", conversation._id);
  }, [conversation._id]);

  /**
   * FIX 2: Normalize socket message.
   *
   * REST API  → senderId = { _id, username, profilePic }  (populated)  ✅
   * Socket    → senderId = "686abc..."                    (raw string)  ❌ crashes
   *
   * We resolve the sender from conversation.participants.
   * If the sender is the logged-in user (own message echoed back),
   * we build the object from the auth store.
   */
  const normalizeSender = useCallback(
    (msg: any): Message => {
      // Already populated — nothing to do (REST history shape)
      if (typeof msg.senderId === "object" && msg.senderId !== null) {
        return msg as Message;
      }

      const rawId = msg.senderId as string;

      // Try to find sender in participants
      const participant = conversation.participants.find((p) => p._id === rawId);
      const resolvedSender = participant
        ? { _id: participant._id, username: participant.username, profilePic: participant.profilePic }
        : { _id: rawId, username: "Unknown", profilePic: "" };

      return { ...msg, senderId: resolvedSender } as Message;
    },
    [conversation.participants]
  );

  // 4. appendMessage — called by DashboardPage when socket fires receive_message
  const appendMessage = useCallback(
    (msg: any) => {
      // Ignore messages for other conversations
      if (msg.conversationId !== conversation._id) return;
      const normalized = normalizeSender(msg);
      setMessages((prev) => [...prev, normalized]);
    },
    [conversation._id, normalizeSender]
  );

  // Register with Dashboard's global socket handler
  useEffect(() => {
    registerAppend(appendMessage);
  }, [registerAppend, appendMessage]);

  // 5. Send via socket
  const [isSending, setIsSending] = useState(false);

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

  const other =
    conversation.participants.find((p) => p._id !== myId) ??
    conversation.participants[0];

  function avatarGradient(name: string) {
    const palette = [
      "from-rose-400 to-pink-500",
      "from-emerald-400 to-teal-500",
      "from-sky-400 to-blue-500",
      "from-violet-400 to-purple-500",
    ];
    let h = 0;
    for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
    return palette[h % palette.length];
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-neutral-50 dark:bg-neutral-950">

      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 -ml-1 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="relative shrink-0">
          <Avatar className="w-9 h-9 ring-2 ring-white dark:ring-neutral-900">
            <AvatarImage src={other.profilePic} alt={other.username} />
            <AvatarFallback className={`bg-gradient-to-br ${avatarGradient(other.username)} text-white text-xs font-bold`}>
              {other.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className={`
            absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2
            border-white dark:border-neutral-900
            ${other.isOnline ? "bg-emerald-400" : "bg-neutral-300 dark:bg-neutral-600"}
          `} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-neutral-900 dark:text-white truncate leading-snug">
            {other.username}
          </p>
          <p className={`text-xs font-medium leading-none mt-0.5 ${
            other.isOnline ? "text-emerald-500" : "text-neutral-400 dark:text-neutral-500"
          }`}>
            {other.isOnline ? "Online" : "Offline"}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <Video className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <MessageList messages={messages} isLoading={isLoading} />

      <MessageInput
        recipientName={other.username}
        isSending={isSending}
        onSend={handleSend}
      />
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { conversations } = useConversations();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  // Restore last active conversation on page refresh
  useEffect(() => {
    if (conversations.length === 0) return;
    const savedId = localStorage.getItem(ACTIVE_CONV_KEY);
    if (savedId && !activeConversation) {
      const found = conversations.find((c) => c._id === savedId);
      if (found) setActiveConversation(found);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  function handleSelectConversation(conv: Conversation) {
    localStorage.setItem(ACTIVE_CONV_KEY, conv._id);
    appendRef.current = null;
    setActiveConversation(conv);
  }

  function handleBack() {
    localStorage.removeItem(ACTIVE_CONV_KEY);
    appendRef.current = null;
    setActiveConversation(null);
  }

  // Global socket message handler — routes to whichever ChatArea is mounted
  const appendRef = useRef<((msg: any) => void) | null>(null);

  const handleReceiveMessage = useCallback((message: any) => {
    appendRef.current?.(message);
  }, []);

  useSocketConnection({ userId: user?._id, onReceiveMessage: handleReceiveMessage });

  const registerAppend = useCallback((fn: (msg: any) => void) => {
    appendRef.current = fn;
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-neutral-900">

      {/* Sidebar */}
      <div className={`
        ${activeConversation ? "hidden md:flex" : "flex"}
        w-full md:w-72 xl:w-80 shrink-0 flex-col h-full
      `}>
        <Sidebar
          activeConversationId={activeConversation?._id ?? null}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Chat panel */}
      <div className={`
        ${activeConversation ? "flex" : "hidden md:flex"}
        flex-1 flex-col min-w-0 h-full
      `}>
        {activeConversation ? (
          <ChatArea
            key={activeConversation._id}
            conversation={activeConversation}
            onBack={handleBack}
            registerAppend={registerAppend}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}