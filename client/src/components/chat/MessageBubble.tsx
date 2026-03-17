// src/components/chat/MessageBubble.tsx

import { Check, CheckCheck } from "lucide-react";
import type { Message, MessageState } from "../../schemas/chat/conversationDetailSchema";
import { useAuthStore } from "../../store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  message: Message;
  showAvatar: boolean;
}

// ── Tick resolver ─────────────────────────────────────────────────────────────
// Checks recipient statuses only (excludes sender's own entry)
function resolveTick(message: Message, myId: string): MessageState {
  const recipientStatuses = message.status.filter((s) => s.userId !== myId);
  if (recipientStatuses.length === 0) return "sent";
  if (recipientStatuses.some((s) => s.state === "read")) return "read";
  if (recipientStatuses.some((s) => s.state === "delivered")) return "delivered";
  return "sent";
}

// ── Tick icon ─────────────────────────────────────────────────────────────────
function TickIcon({ state }: { state: MessageState }) {
  if (state === "read")
    return <CheckCheck className="w-3.5 h-3.5 text-sky-300" aria-label="Read" />;
  if (state === "delivered")
    return <CheckCheck className="w-3.5 h-3.5 text-white/55" aria-label="Delivered" />;
  return <Check className="w-3.5 h-3.5 text-white/55" aria-label="Sent" />;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function MessageBubble({ message, showAvatar }: Props) {
  const myId = useAuthStore((s) => s.user?._id ?? "");

  // FIX: Guard against senderId being a raw string (socket message, not yet normalized)
  // This should not happen after DashboardPage.normalizeSender runs, but defensive check.
  const sender =
    typeof message.senderId === "object" && message.senderId !== null
      ? message.senderId
      : { _id: String(message.senderId), username: "?", profilePic: "" };

  const isOwn = sender._id === myId;
  const tickState = isOwn ? resolveTick(message, myId) : null;

  // Safe slice — never crashes even if username is somehow empty
  const initials = (sender.username ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className={`flex items-end gap-2 mb-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>

      {/* Avatar — received messages only, first in a sender group */}
      <div className="w-7 shrink-0 self-end mb-0.5">
        {!isOwn && showAvatar ? (
          <Avatar className="w-7 h-7">
            <AvatarImage src={sender.profilePic} alt={sender.username} />
            <AvatarFallback
              className={`bg-gradient-to-br ${avatarGradient(sender.username ?? "?")} text-white text-[9px] font-bold`}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        ) : null}
      </div>

      {/* Bubble */}
      <div
        className={`
          relative max-w-[70%] sm:max-w-[58%] lg:max-w-[50%]
          px-3.5 pt-2 pb-[22px] rounded-2xl shadow-sm
          ${isOwn
            ? "bg-sky-500 text-white rounded-br-[4px]"
            : "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-[4px] border border-neutral-100 dark:border-neutral-700/60"
          }
        `}
      >
        {/* Sender name — received messages, first in group */}
        {!isOwn && showAvatar && (
          <p className="text-[10px] font-semibold text-sky-500 dark:text-sky-400 mb-1 leading-none">
            {sender.username}
          </p>
        )}

        {/* Message text */}
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
          {message.content}
        </p>

        {/* Time + tick */}
        <div className="absolute bottom-1.5 right-2.5 flex items-center gap-1">
          <span
            className={`text-[10px] tabular-nums leading-none ${
              isOwn ? "text-white/55" : "text-neutral-400 dark:text-neutral-500"
            }`}
          >
            {formatTime(message.createdAt)}
          </span>
          {isOwn && tickState && <TickIcon state={tickState} />}
        </div>
      </div>
    </div>
  );
}