import { Check, X } from "lucide-react";
import type { ChatRequest } from "../../workers/chat/getChatRequest";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
 
interface Props {
  request: ChatRequest;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  isAccepting: boolean;
}
 
export default function ChatRequestItem({
  request,
  onAccept,
  onReject,
  isAccepting,
}: Props) {
  const { senderId } = request;
  const initials = senderId.username.slice(0, 2).toUpperCase();
 
  function avatarGradient(name: string) {
    const palette = [
      "from-rose-400 to-pink-500",
      "from-orange-400 to-amber-500",
      "from-emerald-400 to-teal-500",
      "from-sky-400 to-blue-500",
      "from-violet-400 to-purple-500",
    ];
    let h = 0;
    for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
    return palette[h % palette.length];
  }
 
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors">
 
      {/* Avatar */}
      <Avatar className="w-10 h-10 shrink-0">
        <AvatarImage src={senderId.profilePic} alt={senderId.username} />
        <AvatarFallback
          className={`bg-gradient-to-br ${avatarGradient(senderId.username)} text-white text-xs font-bold`}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
 
      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
          {senderId.username}
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
          Wants to chat with you
        </p>
      </div>
 
      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Accept */}
        <Button
          size="icon"
          onClick={() => onAccept(request._id)}
          disabled={isAccepting}
          className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 disabled:opacity-60 transition-all"
        >
          {isAccepting ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
        </Button>
 
        {/* Reject */}
        <Button
          size="icon"
          onClick={() => onReject(request._id)}
          disabled={isAccepting}
          className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-500 hover:text-rose-500 dark:hover:text-rose-400 shadow-none border-0 disabled:opacity-60 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}