import { useEffect, useRef } from "react";
import { socket } from "../socket/socket";
import type { Message } from "../schemas/chat/conversationDetailSchema";

interface Options {
  userId: string | undefined;
  onReceiveMessage: (message: Message) => void;
}
 
export function useSocketConnection({ userId, onReceiveMessage }: Options) {
  const callbackRef = useRef(onReceiveMessage);
  callbackRef.current = onReceiveMessage;
 
  useEffect(() => {
    if (!userId) return;
 
    if (!socket.connected) socket.connect();
    socket.emit("user_connected", userId);
 
    function handleMessage(message: Message) {
      callbackRef.current(message);
    }
 
    socket.on("receive_message", handleMessage);
    return () => { socket.off("receive_message", handleMessage); };
  }, [userId]);
}