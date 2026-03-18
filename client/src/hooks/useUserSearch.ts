import { useState } from "react";
import toast from "react-hot-toast";
import { searchUserWorker } from "../workers/chat/searchUser";
import { sendChatRequestWorker } from "../workers/chat/sendChatRequest";
import type { SearchedUser } from "../workers/chat/searchUser";
 
import { socket } from "../socket/socket";
 
export function useUserSearch() {
  const [searchResult, setSearchResult] = useState<SearchedUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
 
  async function searchUser(phoneNo: string) {
    const trimmed = phoneNo.trim();
    if (!trimmed) return;
 
    setIsSearching(true);
    setSearchResult(null);
    try {
      const res = await searchUserWorker(trimmed);
      if (res.success && res.data) {
        setSearchResult(res.data);
      } else {
        toast.error("User not found");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "User not found");
    } finally {
      setIsSearching(false);
    }
  }
 
  async function sendRequest(phoneNo: string) {
    if (!searchResult) return;
    setIsSending(true);
    try {
      await sendChatRequestWorker({ phoneNo });
      toast.success("Chat request sent");
 
      // FIX 2: Recipient ko socket se notify karo taaki unka bell count live update ho
      socket.emit("notify_chat_request", searchResult._id);
 
      setSearchResult(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to send request");
    } finally {
      setIsSending(false);
    }
  }
 
  function clearResult() {
    setSearchResult(null);
  }
 
  return { searchResult, isSearching, isSending, searchUser, sendRequest, clearResult };
}