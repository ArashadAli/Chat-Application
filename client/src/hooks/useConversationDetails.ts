import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import { conversationDetailsResSchema } from "../schemas/chat/conversationDetailSchema";
import type { Message } from "../schemas/chat/conversationDetailSchema";
import { validate } from "../utils/validateResSchema";

export function useConversationDetails(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function fetchMessages() {
      setIsLoading(true);
      try {
        const res = await axiosInstance.get(`/user/conversation/${conversationId}`);
        const data = validate(conversationDetailsResSchema, res.data);
        if (!cancelled) setMessages(data.messages);
      } catch (err: any) {
        if (!cancelled) {
          toast.error(err?.response?.data?.message ?? "Failed to load messages");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchMessages();
    return () => { cancelled = true; };
  }, [conversationId]);

  return { messages, setMessages, isLoading };
}