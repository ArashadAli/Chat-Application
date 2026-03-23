import { useState, useCallback, useRef, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useSocketConnection } from "../../hooks/useSocketConnection";
import { useConversations } from "../../hooks/useConversation";
import { useChatRequests } from "../../hooks/useChatRequest";
import type { Conversation } from "../../schemas/chat/conversationListResSchema";
import type { Message } from "../../schemas/chat/conversationDetailSchema";
import Sidebar from "../../components/chat/Sidebar";
import ChatArea from "../../components/chat/ChatArea";

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
    msgUpdatedRef.current = null;
    msgDeletedRef.current = null;
    setActiveConversation(conv);
    setConversations((prev) =>
      prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c))
    );
  }

  function handleBack() {
    localStorage.removeItem(ACTIVE_CONV_KEY);
    appendRef.current = null;
    statusUpdateRef.current = null;
    msgUpdatedRef.current = null;
    msgDeletedRef.current = null;
    setActiveConversation(null);
  }

  const appendRef = useRef<((msg: any) => void) | null>(null);
  const statusUpdateRef = useRef<((data: any) => void) | null>(null);
  const msgUpdatedRef = useRef<((data: any) => void) | null>(null);
  const msgDeletedRef = useRef<((data: any) => void) | null>(null);
  const activeConversationRef = useRef<Conversation | null>(null);
  activeConversationRef.current = activeConversation;

  // ── New message ───────────────────────────────────────────────────────────
  const handleReceiveMessage = useCallback(
    (message: any) => {
      appendRef.current?.(message);
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === message.conversationId);
        if (!exists) { refetchConversations(); return prev; }
        const updated = prev.map((c) => {
          if (c._id !== message.conversationId) return c;
          const isOpen = activeConversationRef.current?._id === message.conversationId;
          const isFile = message.messageType === "file" || message.messageType === "image";
          const previewText = isFile
            ? (message.messageType === "image" ? "📷 Image" : `📎 ${message.content}`)
            : message.content;
          return {
            ...c,
            lastMessage: {
              _id: message._id ?? "",
              content: previewText,
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

  // ── Socket: message_updated (dusre user ke liye real time) ───────────────
  const handleSocketMessageUpdated = useCallback(
    (data: { messageId: string; conversationId: string; content: string; updatedMessage: any }) => {
      msgUpdatedRef.current?.(data);
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id !== data.conversationId) return c;
          if (c.lastMessage?._id === data.messageId) {
            return { ...c, lastMessage: { ...c.lastMessage, content: data.content } };
          }
          return c;
        })
      );
    },
    [setConversations]
  );

  // ── Socket: message_deleted (dusre user ke liye real time) ───────────────
  const handleSocketMessageDeleted = useCallback(
    (data: { messageId: string; conversationId: string; newLastMessage: any }) => {
      msgDeletedRef.current?.(data);
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id !== data.conversationId) return c;
          return {
            ...c,
            lastMessage: data.newLastMessage
              ? {
                  _id: data.newLastMessage._id,
                  content: data.newLastMessage.content,
                  senderId: data.newLastMessage.senderId,
                  createdAt: data.newLastMessage.createdAt,
                }
              : undefined,
          };
        })
      );
    },
    [setConversations]
  );

  // ── Same user: own message deleted — sidebar update ───────────────────────
  const handleOwnMessageDeleted = useCallback(
    (messageId: string, conversationId: string) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id !== conversationId) return c;
          if (c.lastMessage?._id === messageId) {
            return { ...c, lastMessage: undefined };
          }
          return c;
        })
      );
    },
    [setConversations]
  );

  // ── Same user: own message updated — sidebar update ───────────────────────
  const handleOwnMessageUpdated = useCallback(
    (updatedMessage: Message) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id !== updatedMessage.conversationId) return c;
          if (c.lastMessage?._id === updatedMessage._id) {
            return { ...c, lastMessage: { ...c.lastMessage, content: updatedMessage.content } };
          }
          return c;
        })
      );
    },
    [setConversations]
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

  const handleNewChatRequest = useCallback(() => { chatRequests.fetchRequests(); }, [chatRequests.fetchRequests]);
  const handleConversationCreated = useCallback(() => { refetchConversations(); }, [refetchConversations]);
  const handleMessageStatusUpdate = useCallback((data: any) => { statusUpdateRef.current?.(data); }, []);
  const handleGroupCreated = useCallback(() => { refetchConversations(); }, [refetchConversations]);

  useSocketConnection({
    userId: user?._id,
    onReceiveMessage: handleReceiveMessage,
    onUserStatusChanged: handleUserStatusChanged,
    onNewChatRequest: handleNewChatRequest,
    onConversationCreated: handleConversationCreated,
    onMessageStatusUpdate: handleMessageStatusUpdate,
    onGroupCreated: handleGroupCreated,
    onMessageUpdated: handleSocketMessageUpdated,
    onMessageDeleted: handleSocketMessageDeleted,
  });

  const registerAppend = useCallback((fn: (msg: any) => void) => { appendRef.current = fn; }, []);
  const registerStatusUpdate = useCallback((fn: (data: any) => void) => { statusUpdateRef.current = fn; }, []);
  const registerMsgUpdated = useCallback((fn: (data: any) => void) => { msgUpdatedRef.current = fn; }, []);
  const registerMsgDeleted = useCallback((fn: (data: any) => void) => { msgDeletedRef.current = fn; }, []);

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
            registerMsgUpdated={registerMsgUpdated}
            registerMsgDeleted={registerMsgDeleted}
            onMessageDeleted={handleOwnMessageDeleted}
            onMessageUpdated={handleOwnMessageUpdated}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}