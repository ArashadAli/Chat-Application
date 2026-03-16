import { useState, useCallback, useRef, useEffect } from "react";
import { socket } from "../../socket/socket";
import { useAuthStore } from "../../store/authStore";
import { useSocketConnection } from "../../hooks/useSocketConnection";
import { useChatMessages } from "../../hooks/useChatMsgs";
import { useConversationDetails } from "../../hooks/useConversationDetails";
import type { Conversation } from "../../schemas/chat/conversationListResSchema";
import type { Message } from "../../schemas/chat/conversationDetailSchema";
import Sidebar from "../../components/chat/Sidebar";
import MessageList from "../../components/chat/MessageList";
import MessageInput from "../../components/chat/MessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 select-none gap-4 px-6">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-neutral-200 dark:border-neutral-800 animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-3 rounded-full border border-neutral-100 dark:border-neutral-800/60" />
        <svg className="w-7 h-7 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
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
  /** Stable ref-callback so Dashboard can push incoming messages here */
  registerAppend: (fn: (msg: Message) => void) => void;
}

function ChatArea({ conversation, onBack, registerAppend }: ChatAreaProps) {
  const myId = useAuthStore((s) => s.user?._id ?? "");

  // 1. Fetch initial message history from REST API
  const { messages: history, isLoading } = useConversationDetails(conversation._id);

  // 2. Real-time message state
  const { messages, setMessages, appendMessage, sendMessage, isSending } =
    useChatMessages({ conversationId: conversation._id, senderId: myId });

  // 3. Seed real-time state from API history (runs once per conversation)
  const seededRef = useRef(false);
  useEffect(() => {
    if (!isLoading && !seededRef.current) {
      setMessages(history);
      seededRef.current = true;
    }
  }, [isLoading, history, setMessages]);

  // 4. Join socket room for this conversation
  useEffect(() => {
    socket.emit("join_conversation", conversation._id);
  }, [conversation._id]);

  // 5. Register this ChatArea's appendMessage with the parent Dashboard
  //    so incoming socket messages can be routed here
  useEffect(() => {
    registerAppend(appendMessage);
  }, [registerAppend, appendMessage]);

  const other =
    conversation.participants.find((p) => p._id !== myId) ??
    conversation.participants[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-neutral-50 dark:bg-neutral-950">

      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 -ml-1 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
        >
          <BackIcon />
        </button>

        <Avatar className="w-9 h-9 shrink-0 ring-2 ring-white dark:ring-neutral-900">
          <AvatarImage src={other.profilePic} alt={other.username} />
          <AvatarFallback className="bg-gradient-to-br from-sky-400 to-teal-400 text-white text-xs font-bold">
            {other.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-neutral-900 dark:text-white truncate leading-snug">
            {other.username}
          </p>
          <p className="text-xs text-emerald-500 font-medium leading-none mt-0.5">
            {other.isOnline === true ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input */}
      <MessageInput
        recipientName={other.username}
        isSending={isSending}
        onSend={sendMessage}
      />
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);

  /**
   * appendRef holds the currently active ChatArea's appendMessage function.
   * useSocketConnection calls this ref when a new message arrives.
   * Using a ref avoids re-registering the socket listener on every render.
   */
  const appendRef = useRef<((msg: Message) => void) | null>(null);

  const handleReceiveMessage = useCallback((message: Message) => {
    appendRef.current?.(message);
  }, []);

  // Connect socket + user_connected + receive_message listener
  useSocketConnection({
    userId: user?._id,
    onReceiveMessage: handleReceiveMessage,
  });

  // ChatArea calls this once on mount to register its appendMessage
  const registerAppend = useCallback((fn: (msg: Message) => void) => {
    appendRef.current = fn;
  }, []);

  function handleSelectConversation(conv: Conversation) {
    // Clear stale appender before new ChatArea mounts
    appendRef.current = null;
    setActiveConversation(conv);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-neutral-900">

      {/* Sidebar */}
      <div
        className={`
          ${activeConversation ? "hidden md:flex" : "flex"}
          w-full md:w-72 xl:w-80 shrink-0 flex-col h-full
        `}
      >
        <Sidebar
          activeConversationId={activeConversation?._id ?? null}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Chat panel */}
      <div
        className={`
          ${activeConversation ? "flex" : "hidden md:flex"}
          flex-1 flex-col min-w-0 h-full
        `}
      >
        {activeConversation ? (
          <ChatArea
            key={activeConversation._id}   // remount cleanly on conversation switch
            conversation={activeConversation}
            onBack={() => {
              appendRef.current = null;
              setActiveConversation(null);
            }}
            registerAppend={registerAppend}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}