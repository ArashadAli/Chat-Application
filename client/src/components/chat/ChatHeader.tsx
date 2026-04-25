import { ChevronLeft, Phone, Video, MoreVertical, Users } from "lucide-react";
import type { Conversation } from "../../schemas/chat/conversationListResSchema";
import { useAuthStore } from "../../store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  conversation: Conversation;
  onBack: () => void;
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

export default function ChatHeader({ conversation, onBack }: Props) {
  const myId = useAuthStore((s) => s.user?._id ?? "");
  const isGroup = conversation.isGroup;
  const other = !isGroup
    ? (conversation.participants.find((p) => p._id !== myId) ?? conversation.participants[0])
    : null;

  const name = isGroup ? (conversation.groupMetadata?.groupName ?? "Group") : (other?.username ?? "");
  const isOnline = !isGroup && other?.isOnline;
  const [c1, c2] = getColors(name);

  return (
    <div className="flex items-center gap-3 px-3 sm:px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 shrink-0">

      {/* Back — mobile */}
      <button onClick={onBack}
        className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center -ml-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-all shrink-0">
        <ChevronLeft className="w-5 h-5"/>
      </button>

      {/* Avatar */}
      <div className="relative shrink-0">
        {isGroup ? (
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
            <Users style={{ width: 18, height: 18 }} className="text-white"/>
          </div>
        ) : (
          <>
            <Avatar className="w-10 h-10 rounded-2xl shadow-sm">
              <AvatarImage src={other?.profilePic} alt={other?.username} className="rounded-2xl"/>
              <AvatarFallback className="rounded-2xl text-white text-xs font-bold"
                style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                {(other?.username ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900 transition-colors ${isOnline ? "bg-emerald-400" : "bg-neutral-300 dark:bg-neutral-600"}`}/>
          </>
        )}
      </div>

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-neutral-900 dark:text-white truncate leading-tight">
          {name}
        </p>
        <p className={`text-xs font-medium leading-none mt-0.5 ${
          isGroup ? "text-neutral-400 dark:text-neutral-500"
          : isOnline ? "text-emerald-500"
          : "text-neutral-400 dark:text-neutral-500"
        }`}>
          {isGroup ? `${conversation.participants.length} members` : isOnline ? "Online" : "Offline"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        {!isGroup && (
          <>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-all">
              <Phone className="w-4 h-4"/>
            </button>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-all">
              <Video className="w-4 h-4"/>
            </button>
          </>
        )}
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-all">
          <MoreVertical className="w-4 h-4"/>
        </button>
      </div>
    </div>
  );
}