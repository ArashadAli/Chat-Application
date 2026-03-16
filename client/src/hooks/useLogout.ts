// src/hooks/useLogout.ts

import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { logoutWorker } from "../workers/auth/logoutWorker";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { socket } from "../socket/socket";

export function useLogout() {
  const navigate           = useNavigate();
  const logout             = useAuthStore((s) => s.logout);
  const setConversations   = useChatStore((s) => s.setConversations);

  async function handleLogout() {
    try {
      await logoutWorker();
    } catch {
    } finally {
      logout();                    
      setConversations([]);        
      socket.disconnect();         
      navigate("/login", { replace: true });
      toast.success("Logged out successfully");
    }
  }

  return { handleLogout };
}