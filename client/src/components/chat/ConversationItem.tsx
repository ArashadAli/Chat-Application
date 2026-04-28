import type { Conversation } from "../../schemas/chat/conversationListResSchema";
import { useAuthStore } from "../../store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface Props {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

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

const COLORS = [
  ["#ef4444","#dc2626"], ["#f97316","#ea580c"], ["#10b981","#059669"],
  ["#3b82f6","#2563eb"], ["#8b5cf6","#7c3aed"], ["#ec4899","#db2777"],
  ["#06b6d4","#0891b2"], ["#f59e0b","#d97706"],
];
function getColors(name: string) {
  let h = 0; for (const c of name) h += c.charCodeAt(0);
  return COLORS[h % COLORS.length];
}

export default function ConversationItem({ conversation, isActive, onClick }: Props) {
  const myId = useAuthStore((s) => s.user?._id ?? "");
  const isGroup = conversation.isGroup;
  const other = !isGroup ? getOther(conversation, myId) : null;
  const hasUnread = conversation.unreadCount > 0;

  const displayName = isGroup
    ? (conversation.groupMetadata?.groupName ?? "Group")
    : (other?.username ?? "");

  const initials = displayName.slice(0, 2).toUpperCase();
  const [c1, c2] = getColors(displayName);

  // Profile pic: group pic or user's profilePic (can be empty string → fallback to initials)
  const pic = isGroup
    ? (conversation.groupMetadata?.groupPic ?? "")
    : (other?.profilePic ?? "");

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
        transition-all duration-150 relative group
        ${isActive
          ? "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 shadow-sm"
          : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border border-transparent"
        }
      `}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-indigo-500" />
      )}

      {/* Avatar */}
      <div className="relative shrink-0">
        {isGroup ? (
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden"
            style={{ background: pic ? undefined : `linear-gradient(135deg, ${c1}, ${c2})` }}
          >
            {pic
              ? <img src={pic} alt={displayName} className="w-full h-full object-cover" />
              : <Users className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            }
          </div>
        ) : (
          <>
            <Avatar className="w-11 h-11 rounded-2xl shadow-sm">
              {/* AvatarImage only renders if src is non-empty */}
              <AvatarImage
                src={pic}
                alt={other?.username}
                className="rounded-2xl object-cover"
              />
              <AvatarFallback
                className="rounded-2xl text-white text-xs font-bold"
                style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Online dot */}
            <span className={`
              absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full
              border-2 border-white dark:border-neutral-900 transition-colors
              ${other?.isOnline ? "bg-emerald-400" : "bg-neutral-300 dark:bg-neutral-600"}
            `} />
          </>
        )}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-[13px] font-semibold truncate leading-snug ${
              isActive
                ? "text-indigo-700 dark:text-indigo-300"
                : "text-neutral-900 dark:text-white"
            }`}>
              {displayName}
            </span>
            {isGroup && (
              <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 leading-none">
                GROUP
              </span>
            )}
          </div>
          <span className={`text-[10px] shrink-0 tabular-nums ${
            hasUnread
              ? "text-indigo-500 font-semibold"
              : "text-neutral-400 dark:text-neutral-500"
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
            {conversation.lastMessage?.content ?? "No messages yet"}
          </p>
          {hasUnread && (
            <Badge className="shrink-0 h-[18px] min-w-[18px] px-1.5 text-[10px] font-bold bg-indigo-500 hover:bg-indigo-500 text-white rounded-full border-0">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}