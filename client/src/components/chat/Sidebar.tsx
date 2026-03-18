import { useState, type KeyboardEvent } from "react";
import { LogOut, Search, MessageCircle, Bell, Loader2, Users } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useLogout } from "../../hooks/useLogout";
import { useUserSearch } from "../../hooks/useUserSearch";
import { useCreateGroup } from "../../hooks/useCreateGroup";
import type { Conversation } from "../../schemas/chat/conversationListResSchema";
import type { useChatRequests } from "../../hooks/useChatRequest";
import ConversationItem from "./ConversationItem";
import SearchUserCard from "./SearchUserCard";
import ChatRequestModal from "./ChatRequestModal";
import CreateGroupModal from "./createGroupModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  isConvLoading: boolean;
  refetchConversations: () => void;
  chatRequests: ReturnType<typeof useChatRequests>;
}

export default function Sidebar({
  activeConversationId,
  onSelectConversation,
  conversations,
  isConvLoading,
  refetchConversations,
  chatRequests,
}: SidebarProps) {
  const [inputValue, setInputValue] = useState("");
  const user = useAuthStore((s) => s.user);
  const { handleLogout } = useLogout();

  const { searchResult, isSearching, isSending, searchUser, sendRequest, clearResult } = useUserSearch();

  const { requests, isLoading: reqLoading, isOpen: modalOpen, openModal, closeModal, acceptRequest, rejectRequest } = chatRequests;

  const group = useCreateGroup({
    conversations,
    onGroupCreated: refetchConversations,
  });

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); clearResult(); searchUser(inputValue); }
    if (e.key === "Backspace" && searchResult) clearResult();
  }

  const isPhoneSearch = /^\d+$/.test(inputValue.trim()) && inputValue.trim().length > 0;

  const filtered = isPhoneSearch
    ? conversations
    : conversations.filter((c) => {
        if (c.isGroup) {
          return c.groupMetadata?.groupName?.toLowerCase().includes(inputValue.toLowerCase());
        }
        return c.participants.some(
          (p) => p._id !== user?._id && p.username.toLowerCase().includes(inputValue.toLowerCase())
        );
      });

  const userInitials = user?.username?.slice(0, 2).toUpperCase() ?? "ME";

  return (
    <>
      <aside className="flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
        <div className="px-4 pt-5 pb-3 shrink-0 border-b border-neutral-100 dark:border-neutral-800/70">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-teal-400 flex items-center justify-center shadow-md shadow-sky-500/20">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-neutral-900 dark:text-white">Messages</span>
            </div>

            <div className="flex items-center gap-1">
              {/* Create group */}
              <button
                onClick={group.openModal}
                title="Create group"
                className="p-2 rounded-xl text-neutral-400 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all duration-150"
              >
                <Users className="w-4 h-4" />
              </button>

              {/* Bell */}
              <button
                onClick={openModal}
                title="Chat requests"
                className="relative p-2 rounded-xl text-neutral-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all duration-150"
              >
                <Bell className="w-4 h-4" />
                {requests.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {requests.length > 99 ? "99+" : requests.length}
                  </span>
                )}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-xl text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-150"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            </span>
            <Input
              type="text"
              placeholder="Search by name or phone (Enter)…"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); if (!e.target.value) clearResult(); }}
              onKeyDown={handleKeyDown}
              className="pl-8 h-9 rounded-xl text-sm bg-neutral-100 dark:bg-neutral-800 border-transparent focus-visible:ring-1 focus-visible:ring-sky-400/40 focus-visible:border-sky-400/40 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            />
          </div>

          {searchResult && (
            <SearchUserCard user={searchResult} isSending={isSending} onConnect={sendRequest} onDismiss={clearResult} />
          )}
        </div>

        {user && (
          <div className="mx-3 mt-3 mb-1 px-3 py-2 rounded-xl bg-gradient-to-r from-sky-50 to-teal-50 dark:from-sky-950/40 dark:to-teal-950/30 border border-sky-100 dark:border-sky-900/40 flex items-center gap-2.5 shrink-0">
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-sky-400 to-teal-400 text-white">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate leading-none mb-0.5">{user.username}</p>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate leading-none">{user.phoneNo}</p>
            </div>
            <span className="flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-500">Online</span>
            </span>
          </div>
        )}

        <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-600 shrink-0">
          {inputValue && !isPhoneSearch ? `Results for "${inputValue}"` : "All conversations"}
        </p>

        <ScrollArea className="flex-1 px-2 pb-2">
          {isConvLoading ? (
            <div className="flex items-center justify-center h-28">
              <svg className="w-5 h-5 animate-spin text-sky-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-28 gap-2 pt-4">
              <MessageCircle className="w-7 h-7 text-neutral-300 dark:text-neutral-700" />
              <p className="text-xs text-neutral-400 dark:text-neutral-600 text-center">
                {inputValue && !isPhoneSearch ? "No conversations found" : "No conversations yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5 pt-0.5">
              {filtered.map((conv) => (
                <ConversationItem
                  key={conv._id}
                  conversation={conv}
                  isActive={activeConversationId === conv._id}
                  onClick={() => onSelectConversation(conv)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </aside>

      <ChatRequestModal
        isOpen={modalOpen}
        onClose={closeModal}
        requests={requests}
        isLoading={reqLoading}
        onAccept={acceptRequest}
        onReject={rejectRequest}
      />

      <CreateGroupModal
        isOpen={group.isOpen}
        onClose={group.closeModal}
        conversations={conversations}
        groupName={group.groupName}
        onGroupNameChange={group.setGroupName}
        selectedIds={group.selectedIds}
        onToggle={group.toggleParticipant}
        onSubmit={() => group.createGroup(user?._id ?? "")}
        isCreating={group.isCreating}
      />
    </>
  );
}