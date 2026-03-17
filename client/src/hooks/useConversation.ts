import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import { conversationListResSchema } from "../schemas/chat/conversationListResSchema";
import type { Conversation } from "../schemas/chat/conversationListResSchema";
import { validate } from "../utils/validateResSchema";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchConversations() {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get("/user/conversation");
      const data = validate(conversationListResSchema, res.data);
      setConversations(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchConversations();
  }, []);

  return { conversations, setConversations, isLoading, refetch: fetchConversations };
}