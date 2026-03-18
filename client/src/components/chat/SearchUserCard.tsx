import { UserPlus, X, Loader2 } from "lucide-react";
import type { SearchedUser } from "../../workers/chat/searchUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
 
interface Props {
  user: SearchedUser;
  isSending: boolean;
  onConnect: (phoneNo: string) => void;
  onDismiss: () => void;
}
 
export default function SearchUserCard({ user, isSending, onConnect, onDismiss }: Props) {
  const initials = user.username.slice(0, 2).toUpperCase();
 
  return (
    <div className="mx-1 mt-2 px-3 py-2.5 rounded-xl border border-sky-200/70 dark:border-sky-800/50 bg-sky-50/80 dark:bg-sky-950/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
 
      {/* Avatar */}
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={user.profilePic} alt={user.username} />
        <AvatarFallback className="bg-gradient-to-br from-sky-400 to-teal-400 text-white text-[10px] font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
 
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate leading-snug">
          {user.username}
        </p>
        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate leading-none mt-0.5">
          {user.phoneNo}
        </p>
      </div>
 
      {/* Connect button */}
      <Button
        size="sm"
        onClick={() => onConnect(user.phoneNo)}
        disabled={isSending}
        className="h-7 px-2.5 text-[11px] font-semibold rounded-lg bg-sky-500 hover:bg-sky-600 text-white shadow-sm shadow-sky-500/20 disabled:opacity-60 shrink-0 gap-1"
      >
        {isSending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <UserPlus className="w-3 h-3" />
        )}
        {isSending ? "Sending…" : "Connect"}
      </Button>
 
      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="shrink-0 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}