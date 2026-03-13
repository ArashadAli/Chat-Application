import type { Conversation } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";

interface Props {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

// Derive the "other" participant (not the logged-in user)
function getOtherParticipant(conversation: Conversation, myId: string) {
  return (
    conversation.participants.find((p) => p._id !== myId) ??
    conversation.participants[0]
  );
}

// Consistent color avatar from username initials
function avatarColor(name: string): string {
  const colors = [
    "bg-rose-400",
    "bg-orange-400",
    "bg-amber-400",
    "bg-emerald-400",
    "bg-teal-400",
    "bg-sky-400",
    "bg-violet-400",
    "bg-pink-400",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
}

function formatTime(isoString?: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ConversationItem({ conversation, isActive, onClick }: Props) {
  const myId = useAuthStore((s) => s.user?._id ?? "");
  const other = getOtherParticipant(conversation, myId);
  const initials = other.username.slice(0, 2).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
        transition-all duration-150 group
        ${isActive
          ? "bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800/50"
          : "hover:bg-neutral-100 dark:hover:bg-neutral-800/60 border border-transparent"
        }
      `}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={`w-10 h-10 rounded-full ${avatarColor(other.username)} flex items-center justify-center`}>
          <span className="text-xs font-bold text-white">{initials}</span>
        </div>
        {/* Online indicator placeholder */}
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-neutral-900" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-sm font-semibold truncate ${isActive ? "text-sky-700 dark:text-sky-300" : "text-neutral-900 dark:text-white"}`}>
            {other.username}
          </span>
          {conversation.lastMessage && (
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0">
              {formatTime(conversation.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
          {conversation.lastMessage?.content ?? "Start a conversation"}
        </p>
      </div>
    </button>
  );
}