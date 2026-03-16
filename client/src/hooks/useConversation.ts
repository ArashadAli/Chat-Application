import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getConversationsWorker } from "../workers/chat/getConversationWorker";
import { conversationListResponseSchema } from "../schemas/chat/conversationListResSchema";
import type { Conversation } from "../schemas/chat/conversationListResSchema";
import { validate } from "../utils/validateResSchema";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchConversations() {
    setIsLoading(true);
    try {
      const raw = await getConversationsWorker();
      const data = validate(conversationListResponseSchema, raw);
      setConversations(data);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Failed to load conversations";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchConversations();
  }, []);

  return { conversations, isLoading, refetch: fetchConversations };
}