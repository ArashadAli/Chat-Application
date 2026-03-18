import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { getChatRequestsWorker } from "../workers/chat/getChatRequest";
import { acceptChatRequestWorker } from "../workers/chat/acceptChatRequest";
import { socket } from "../socket/socket";
import type { ChatRequest } from "../workers/chat/getChatRequest";

export function useChatRequests(onConversationCreated?: () => void) {
  const [requests, setRequests] = useState<ChatRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getChatRequestsWorker();
      setRequests(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  function openModal() {
    setIsOpen(true);
    fetchRequests();
  }

  function closeModal() {
    setIsOpen(false);
  }

  async function acceptRequest(requestId: string) {
    try {
      const target = requests.find((r) => r._id === requestId)  // pehle find karo
      const res = await acceptChatRequestWorker({ requestId })
      toast.success("Conversation created")
      setRequests((prev) => prev.filter((r) => r._id !== requestId))

      // NEW — sender ko notify karo
      if (target && res.conversation?._id) {
        socket.emit("accept_chat_request", {
          conversationId: res.conversation._id,
          otherUserId: target.senderId._id,
        })
      }

      onConversationCreated?.()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to accept request")
    }
  }

  function rejectRequest(requestId: string) {
    setRequests((prev) => prev.filter((r) => r._id !== requestId));
  }

  return {
    requests,
    isLoading,
    isOpen,
    openModal,
    closeModal,
    acceptRequest,
    rejectRequest,
    fetchRequests,
  };
}