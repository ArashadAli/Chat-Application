import { ChevronLeft, Phone, Video, MoreVertical, Users } from "lucide-react";
import type { Conversation } from "../../schemas/chat/conversationListResSchema";
import { useAuthStore } from "../../store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  conversation: Conversation;
  onBack: () => void;
}

function avatarGradient(name: string) {
  const palette = [
    "from-rose-400 to-pink-500",
    "from-emerald-400 to-teal-500",
    "from-sky-400 to-blue-500",
    "from-violet-400 to-purple-500",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return palette[h % palette.length];
}

export default function ChatHeader({ conversation, onBack }: Props) {
  const myId = useAuthStore((s) => s.user?._id ?? "");
  const isGroup = conversation.isGroup;

  const other = !isGroup
    ? (conversation.participants.find((p) => p._id !== myId) ?? conversation.participants[0])
    : null;

  const groupName = conversation.groupMetadata?.groupName ?? "Group";
  const headerName = isGroup ? groupName : (other?.username ?? "");
  const memberCount = conversation.participants.length;
  const headerSubtitle = isGroup
    ? `${memberCount} members`
    : other?.isOnline
    ? "Online"
    : "Offline";
  const subtitleColor = isGroup
    ? "text-neutral-400 dark:text-neutral-500"
    : other?.isOnline
    ? "text-emerald-500"
    : "text-neutral-400 dark:text-neutral-500";

  return (
    <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-3 shrink-0">
      <button
        onClick={onBack}
        className="md:hidden p-1.5 -ml-1 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="relative shrink-0">
        {isGroup ? (
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(groupName)} flex items-center justify-center ring-2 ring-white dark:ring-neutral-900`}>
            <Users className="w-4 h-4 text-white" />
          </div>
        ) : (
          <>
            <Avatar className="w-9 h-9 ring-2 ring-white dark:ring-neutral-900">
              <AvatarImage src={other?.profilePic} alt={other?.username} />
              <AvatarFallback className={`bg-gradient-to-br ${avatarGradient(other?.username ?? "")} text-white text-xs font-bold`}>
                {(other?.username ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-neutral-900 ${other?.isOnline ? "bg-emerald-400" : "bg-neutral-300 dark:bg-neutral-600"}`} />
          </>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-neutral-900 dark:text-white truncate leading-snug">
          {headerName}
        </p>
        <p className={`text-xs font-medium leading-none mt-0.5 ${subtitleColor}`}>
          {headerSubtitle}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!isGroup && (
          <>
            <button className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <Video className="w-4 h-4" />
            </button>
          </>
        )}
        <button className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}