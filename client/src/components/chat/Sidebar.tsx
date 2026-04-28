import { useState, useEffect, type KeyboardEvent } from "react";
import { LogOut, Search, MessageCircle, Bell, Loader2, Users, UserCircle } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useLogout } from "../../hooks/useLogout";
import { useUserSearch } from "../../hooks/useUserSearch";
import { useCreateGroup } from "../../hooks/useCreateGroup";
import { useDebounce } from "../../hooks/useDebounce";
import type { Conversation } from "../../schemas/chat/conversationListResSchema";
import type { useChatRequests } from "../../hooks/useChatRequest";
import ConversationItem from "./ConversationItem";
import SearchUserCard from "./SearchUserCard";
import ChatRequestModal from "./ChatRequestModal";
import CreateGroupModal from "./createGroupModal";
import ProfileModal from "../common/profileModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const COLORS = [
  ["#ef4444","#dc2626"], ["#f97316","#ea580c"], ["#10b981","#059669"],
  ["#3b82f6","#2563eb"], ["#8b5cf6","#7c3aed"], ["#ec4899","#db2777"],
  ["#06b6d4","#0891b2"], ["#f59e0b","#d97706"],
];
function getColors(name: string) {
  let h = 0; for (const c of name) h += c.charCodeAt(0);
  return COLORS[h % COLORS.length];
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
  const [profileOpen, setProfileOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const { handleLogout } = useLogout();
  const { searchResult, isSearching, isSending, searchUser, sendRequest, clearResult } = useUserSearch();
  const {
    requests, isLoading: reqLoading, isOpen: modalOpen,
    openModal, closeModal, acceptRequest, rejectRequest,
  } = chatRequests;

  const group = useCreateGroup({ conversations, onGroupCreated: refetchConversations });

  const isPhoneSearch = /^\d+$/.test(inputValue.trim()) && inputValue.trim().length > 0;
  const debouncedInput = useDebounce(inputValue.trim(), 1000);

  useEffect(() => {
    if (/^\d+$/.test(debouncedInput) && debouncedInput.length > 0) {
      clearResult();
      searchUser(debouncedInput);
    } else if (!debouncedInput) {
      clearResult();
    }
  }, [debouncedInput]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    if (!/^\d+$/.test(val.trim())) clearResult();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") { setInputValue(""); clearResult(); }
  }

  const filtered = isPhoneSearch
    ? conversations
    : conversations.filter((c) => {
        if (!inputValue.trim()) return true;
        if (c.isGroup) return c.groupMetadata?.groupName?.toLowerCase().includes(inputValue.toLowerCase());
        return c.participants.some(
          (p) => p._id !== user?._id && p.username.toLowerCase().includes(inputValue.toLowerCase())
        );
      });

  // Current user avatar
  const userPic = (user as any)?.profilePic ?? "";
  const [uc1, uc2] = getColors(user?.username ?? "?");
  const userInitials = user?.username?.slice(0, 2).toUpperCase() ?? "ME";

  return (
    <>
      <aside className="flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div className="px-4 pt-5 pb-3 shrink-0 border-b border-neutral-100 dark:border-neutral-800/70">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-neutral-900 dark:text-white">
                Messages
              </span>
            </div>

            <div className="flex items-center gap-0.5">
              {/* Create group */}
              <button onClick={group.openModal} title="New group"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all">
                <Users className="w-4 h-4" />
              </button>

              {/* Requests bell */}
              <button onClick={openModal} title="Chat requests"
                className="relative w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all">
                <Bell className="w-4 h-4" />
                {requests.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {requests.length > 99 ? "99+" : requests.length}
                  </span>
                )}
              </button>

              {/* Logout */}
              <button onClick={handleLogout} title="Logout"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              {isSearching
                ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                : <Search className="w-3.5 h-3.5" />}
            </span>
            <Input
              type="text"
              placeholder="Search or type phone number…"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="pl-8 h-9 rounded-xl text-sm bg-neutral-100 dark:bg-neutral-800 border-transparent focus-visible:ring-1 focus-visible:ring-indigo-400/40 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            />
            {isPhoneSearch && !isSearching && !searchResult && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-0.5">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
            )}
          </div>

          {searchResult && (
            <SearchUserCard
              user={searchResult}
              isSending={isSending}
              onConnect={sendRequest}
              onDismiss={() => { clearResult(); setInputValue(""); }}
            />
          )}

          {isPhoneSearch && !searchResult && !isSearching && (
            <p className="text-[10px] text-neutral-400 dark:text-neutral-600 mt-1.5 pl-1">
              Searching for user with this number…
            </p>
          )}
        </div>

        {/* ── Current user pill ─────────────────────────────────────────── */}
        {user && (
          <button
            onClick={() => setProfileOpen(true)}
            className="mx-3 mt-3 mb-1 px-3 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/30 flex items-center gap-2.5 shrink-0 hover:from-indigo-100 hover:to-violet-100 dark:hover:from-indigo-950/60 dark:hover:to-violet-950/50 transition-all group"
          >
            {/* User avatar — real pic or initials */}
            <div className="relative shrink-0">
              <Avatar className="w-8 h-8 rounded-xl">
                <AvatarImage src={userPic} alt={user.username} className="rounded-xl object-cover" />
                <AvatarFallback
                  className="rounded-xl text-white text-[10px] font-bold"
                  style={{ background: `linear-gradient(135deg, ${uc1}, ${uc2})` }}
                >
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-neutral-900" />
            </div>

            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate leading-none mb-0.5">
                {user.username}
              </p>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate leading-none">
                {user.phoneNo}
              </p>
            </div>

            <UserCircle className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-indigo-400 transition-colors shrink-0" />
          </button>
        )}

        <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-600 shrink-0">
          {isPhoneSearch ? "Searching by phone" : inputValue.trim() ? `Results for "${inputValue}"` : "All conversations"}
        </p>

        {/* ── Conversation list ─────────────────────────────────────────── */}
        <ScrollArea className="flex-1 px-2 pb-2">
          {isConvLoading ? (
            <div className="flex items-center justify-center h-28">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-100 dark:border-indigo-900/60" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-28 gap-2 pt-4">
              <MessageCircle className="w-7 h-7 text-neutral-300 dark:text-neutral-700" />
              <p className="text-xs text-neutral-400 dark:text-neutral-600 text-center">
                {inputValue.trim() && !isPhoneSearch ? "No conversations found" : "No conversations yet"}
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

      {/* Modals */}
      <ChatRequestModal
        isOpen={modalOpen} onClose={closeModal}
        requests={requests} isLoading={reqLoading}
        onAccept={acceptRequest} onReject={rejectRequest}
      />

      <CreateGroupModal
        isOpen={group.isOpen} onClose={group.closeModal}
        conversations={conversations}
        groupName={group.groupName}
        onGroupNameChange={group.setGroupName}
        selectedIds={group.selectedIds}
        onToggle={group.toggleParticipant}
        onSubmit={() => group.createGroup(user?._id ?? "")}
        isCreating={group.isCreating}
      />

      {/* Profile edit modal */}
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}