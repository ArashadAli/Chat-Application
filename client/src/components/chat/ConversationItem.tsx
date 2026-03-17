import type { Conversation } from "../../schemas/chat/conversationListResSchema";
import { useAuthStore } from "../../store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Props {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function getOther(conv: Conversation, myId: string) {
  return conv.participants.find((p) => p._id !== myId) ?? conv.participants[0];
}

function formatTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86_400_000
  );
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function avatarGradient(name: string) {
  const palette = [
    "from-rose-400 to-pink-500",
    "from-orange-400 to-amber-500",
    "from-emerald-400 to-teal-500",
    "from-sky-400 to-blue-500",
    "from-violet-400 to-purple-500",
    "from-fuchsia-400 to-pink-500",
    "from-cyan-400 to-sky-500",
    "from-lime-400 to-emerald-500",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return palette[h % palette.length];
}

// ── component ─────────────────────────────────────────────────────────────────

export default function ConversationItem({ conversation, isActive, onClick }: Props) {
  const myId = useAuthStore((s) => s.user?._id ?? "");
  const other = getOther(conversation, myId);
  const initials = other.username.slice(0, 2).toUpperCase();
  const hasUnread = conversation.unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
        transition-all duration-150 relative
        ${isActive
          ? "bg-sky-50 dark:bg-sky-950/50 border border-sky-200/70 dark:border-sky-800/50 shadow-sm"
          : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border border-transparent"
        }
      `}
    >
      {/* Active left bar */}
      {isActive && (
        <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-sky-500" />
      )}

      {/* Avatar + online dot */}
      <div className="relative shrink-0">
        <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-neutral-900">
          <AvatarImage src={other.profilePic} alt={other.username} />
          <AvatarFallback className={`bg-gradient-to-br ${avatarGradient(other.username)} text-white text-xs font-bold`}>
            {initials}
          </AvatarFallback>
        </Avatar>
        {/* Online/offline dot */}
        <span className={`
          absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2
          border-white dark:border-neutral-900
          ${other.isOnline ? "bg-emerald-400" : "bg-neutral-300 dark:bg-neutral-600"}
        `} />
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className={`text-[13px] font-semibold truncate leading-snug ${
            isActive ? "text-sky-700 dark:text-sky-300" : "text-neutral-900 dark:text-white"
          }`}>
            {other.username}
          </span>
          <span className={`text-[10px] shrink-0 tabular-nums ${
            hasUnread ? "text-sky-500 font-semibold" : "text-neutral-400 dark:text-neutral-500"
          }`}>
            {formatTime(conversation.lastMessage?.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <p className={`text-xs truncate ${
            hasUnread
              ? "text-neutral-700 dark:text-neutral-300 font-medium"
              : "text-neutral-400 dark:text-neutral-500"
          }`}>
            {conversation.lastMessage?.content ?? "Start a conversation"}
          </p>

          {/* Unread badge */}
          {hasUnread && (
            <Badge className="shrink-0 h-[18px] min-w-[18px] px-1.5 text-[10px] font-bold bg-sky-500 hover:bg-sky-500 text-white rounded-full border-0">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}