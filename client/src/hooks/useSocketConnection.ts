import { useEffect, useRef } from "react";
import { socket } from "../socket/socket";
import type { Message } from "../schemas/chat/conversationDetailSchema";

interface UseSocketConnectionOptions {
  userId: string | undefined;
  onReceiveMessage: (message: Message) => void;
}

/**
 * Responsibilities:
 *  1. Connect socket when userId is available.
 *  2. Emit "user_connected" with userId.
 *  3. Register "receive_message" listener.
 *  4. Clean up listener on unmount — does NOT disconnect socket
 *     (socket lifetime is tied to the app session, not this component).
 */
export function useSocketConnection({
  userId,
  onReceiveMessage,
}: UseSocketConnectionOptions) {
 
  const onReceiveRef = useRef(onReceiveMessage);
  onReceiveRef.current = onReceiveMessage;

  useEffect(() => {
    if (!userId) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("user_connected", userId);

    function handleReceiveMessage(message: Message) {
      onReceiveRef.current(message);
    }

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [userId]);
}