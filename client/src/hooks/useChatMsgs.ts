import { useState, useCallback } from "react";
import { socket } from "../socket/socket";
import type { Message } from "../schemas/chat/conversationDetailSchema";

interface UseChatMessagesOptions {
  conversationId: string | null;
  senderId: string | undefined;
}

export function useChatMessages({ conversationId, senderId }: UseChatMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  /**
   * Append an incoming socket message.
   * Only appends if it belongs to the currently open conversation.
   */
  const appendMessage = useCallback((message: Message) => {
    if (message.conversationId !== conversationId) return;
    setMessages((prev) => [...prev, message]);
  }, [conversationId]);

  /**
   * Send a message:
   *  1. Emit via socket (real-time delivery).
   *  2. Call sendMessageWorker as a reliable POST fallback / persistence layer.
   *  3. Optimistically push the message to local state immediately.
   */
  const sendMessage = useCallback(
    async (content: string) => {

       

      if (!conversationId || !senderId || !content.trim()) return;

      setIsSending(true);
      try {
        // Emit over socket — server will broadcast to all room members
        
        socket.emit("send_message", {
          conversationId,
          senderId,
          message: content.trim(),
        });

        // Worker call for persistence / error visibility
    
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, senderId]
  );

  return { messages, setMessages, appendMessage, sendMessage, isSending };
}