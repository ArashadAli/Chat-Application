import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getConversationMessagesWorker } from "../workers/chat/getConversationMsgWorker";
import { conversationDetailsResponseSchema } from "../schemas/chat/conversationDetailSchema";
import type { Message } from "../schemas/chat/conversationDetailSchema";
import { validate } from "../utils/validateResSchema";

export function useConversationDetails(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchMessages(id: string) {
    setIsLoading(true);
    try {
      const raw = await getConversationMessagesWorker(id);
      const data = validate(conversationDetailsResponseSchema, raw);
      setMessages(data.messages);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Failed to load messages";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    fetchMessages(conversationId);
  }, [conversationId]);

  return { messages, isLoading, setMessages };
}