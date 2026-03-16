// src/components/chat/Sidebar.tsx

import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useLogout } from "../../hooks/useLogout";
import { useConversations } from "../../hooks/useConversation";
import type { Conversation } from "../../schemas/chat/conversationListResSchema";
import ConversationItem from "./ConversationItem";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";


const SearchIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);


interface SidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
}


export default function Sidebar({ activeConversationId, onSelectConversation }: SidebarProps) {
  const [search, setSearch] = useState("");

  const user = useAuthStore((s) => s.user);
  const { handleLogout } = useLogout();
  const { conversations, isLoading } = useConversations();

  // console.log("user from sidebar : ", user)

  const filtered = conversations.filter((c : any) =>
    c.participants.some(
      (p : any) =>
        p._id !== user?._id &&
        (p.username.toLowerCase().includes(search.toLowerCase()) ||
          p._id.includes(search))
    )
  );

  // console.log("filtered from sidebar : ", filtered)

  const userInitials = user?.username?.slice(0, 2).toUpperCase() ?? "ME";

  // console.log("userInitials from sidebar : ", userInitials)

  return (
    <aside className="flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">

      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-3 shrink-0 border-b border-neutral-100 dark:border-neutral-800/70">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-teal-400 flex items-center justify-center shadow-md shadow-sky-500/20">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-neutral-900 dark:text-white">
              Messages
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-xl text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-150"
          >
            <LogoutIcon />
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <SearchIcon />
          </span>
          <Input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 rounded-xl text-sm bg-neutral-100 dark:bg-neutral-800 border-transparent focus-visible:ring-1 focus-visible:ring-sky-400/40 focus-visible:border-sky-400/40 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
          />
        </div>
      </div>

      {/* ── Current user pill ── */}
      {user && (
        <div className="mx-3 mt-3 mb-1 px-3 py-2 rounded-xl bg-gradient-to-r from-sky-50 to-teal-50 dark:from-sky-950/40 dark:to-teal-950/30 border border-sky-100 dark:border-sky-900/40 flex items-center gap-2.5 shrink-0">
          <Avatar className="w-7 h-7 shrink-0">
            <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-sky-400 to-teal-400 text-white">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate leading-none mb-0.5">
              {user.username}
            </p>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate leading-none">
              {user.phoneNo}
            </p>
          </div>
          <span className="flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-500">{user ? "Online" : "Offline"}</span>
          </span>
        </div>
      )}

      {/* ── Section label ── */}
      <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-600 shrink-0">
        {search ? `Results for "${search}"` : "All conversations"}
      </p>

      {/* ── List ── */}
      <ScrollArea className="flex-1 px-2 pb-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-28">
            <svg className="w-5 h-5 animate-spin text-sky-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-28 gap-2 pt-4">
            <svg className="w-7 h-7 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
            <p className="text-xs text-neutral-400 dark:text-neutral-600 text-center">
              {search ? "No conversations found" : "No conversations yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 pt-0.5">
            {filtered.map((conv : any) => (
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
  );
}