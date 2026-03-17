import { useState } from "react"
import {
  LogOut,
  Search,
  MessageCircle,
  Bell
} from "lucide-react"

import { useAuthStore } from "../../store/authStore"
import { useLogout } from "../../hooks/useLogout"
import { useConversations } from "../../hooks/useConversation"
import useChatRequests from "../../hooks/useCHatRequest"

import { sendChatRequestWorker } from "../../workers/chat/sendChatRequest"

import type { Conversation } from "../../schemas/chat/conversationListResSchema"

import ConversationItem from "./ConversationItem"
import ChatRequestModal from "./ChatRequestModal"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

import { toast } from "react-hot-toast"

import { searchUserWorker } from "@/workers/chat/searchUser"

interface SidebarProps {
  activeConversationId: string | null
  onSelectConversation: (conversation: Conversation) => void
}

export default function Sidebar({
  activeConversationId,
  onSelectConversation
}: SidebarProps) {

  const [search, setSearch] = useState("")

  const user = useAuthStore((s) => s.user)

  const { handleLogout } = useLogout()

  const { conversations, isLoading } = useConversations()

  const {
    requests,
    open,
    setOpen,
    acceptRequest,
    rejectRequest
  } = useChatRequests()

  const userInitials =
    user?.username?.slice(0, 2).toUpperCase() ?? "ME"

  // Filter conversations
  const filtered = conversations.filter((c) =>
    c.participants.some(
      (p) =>
        p._id !== user?._id &&
        (p.username.toLowerCase().includes(search.toLowerCase()) ||
          p._id.includes(search))
    )
  )

  // Send request on ENTER
  const handleSendRequest = async () => {

    if (!search.trim()) return

    try {

      await searchUserWorker(search)

      toast.success("Chat request sent")

      setSearch("")

    } catch (err: any) {

      toast.error(err?.response?.data?.message || "Request failed")

    }
  }

  return (
    <aside className="flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">

      {/* HEADER */}
      <div className="px-4 pt-5 pb-3 shrink-0 border-b border-neutral-100 dark:border-neutral-800/70">

        <div className="flex items-center justify-between mb-4">

          {/* Title */}
          <div className="flex items-center gap-2.5">

            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-teal-400 flex items-center justify-center shadow-md shadow-sky-500/20">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>

            <span className="text-[15px] font-bold tracking-tight text-neutral-900 dark:text-white">
              Messages
            </span>

          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">

            {/* Request Notification */}
            <button
              onClick={() => setOpen(true)}
              className="relative p-2 rounded-xl text-neutral-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition"
            >

              <Bell className="w-4 h-4" />

              {requests.length > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-red-500 text-white px-1.5 py-[1px] rounded-full">
                  {requests.length}
                </span>
              )}

            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-xl text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* SEARCH INPUT */}
        <div className="relative">

          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <Search className="w-3.5 h-3.5" />
          </span>

          <Input
            type="text"
            placeholder="Send request on user Ph.no"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendRequest()
            }}
            className="pl-8 h-9 rounded-xl text-sm bg-neutral-100 dark:bg-neutral-800 border-transparent focus-visible:ring-1 focus-visible:ring-sky-400/40 focus-visible:border-sky-400/40 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
          />

        </div>

      </div>

      {/* LOGGED USER */}
      {user && (

        <div className="mx-3 mt-3 mb-1 px-3 py-2 rounded-xl bg-gradient-to-r from-sky-50 to-teal-50 dark:from-sky-950/40 dark:to-teal-950/30 border border-sky-100 dark:border-sky-900/40 flex items-center gap-2.5 shrink-0">

          <Avatar className="w-7 h-7 shrink-0">

            <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-sky-400 to-teal-400 text-white">
              {userInitials}
            </AvatarFallback>

          </Avatar>

          <div className="flex-1 min-w-0">

            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
              {user.username}
            </p>

            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
              {user.phoneNo}
            </p>

          </div>

          <span className="flex items-center gap-1">

            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />

            <span className="text-[10px] font-medium text-emerald-500">
              Online
            </span>

          </span>

        </div>

      )}

      {/* LABEL */}
      <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-600 shrink-0">
        {search ? `Results for "${search}"` : "All conversations"}
      </p>

      {/* LIST */}
      <ScrollArea className="flex-1 px-2 pb-2">

        {isLoading ? (

          <div className="flex items-center justify-center h-28">

            <svg
              className="w-5 h-5 animate-spin text-sky-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />

              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />

            </svg>

          </div>

        ) : filtered.length === 0 ? (

          <div className="flex flex-col items-center justify-center h-28 gap-2 pt-4">

            <MessageCircle className="w-7 h-7 text-neutral-300 dark:text-neutral-700" />

            <p className="text-xs text-neutral-400 dark:text-neutral-600 text-center">
              {search ? "No conversations found" : "No conversations yet"}
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

      {/* CHAT REQUEST MODAL */}
      <ChatRequestModal
        open={open}
        setOpen={setOpen}
        requests={requests}
        acceptRequest={acceptRequest}
        rejectRequest={rejectRequest}
      />

    </aside>
  )
}