import { useEffect, useRef } from "react";
import type { Message } from "../../schemas/chat/conversationDetailSchema";
import MessageBubble from "./MessageBubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle } from "lucide-react";

// ── date label ────────────────────────────────────────────────────────────────
function getDateLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (new Date(now.toDateString()).getTime() - new Date(date.toDateString()).getTime()) /
      86_400_000
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "long" });
  return date.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

function groupByDate(messages: Message[]) {
  const map = new Map<string, Message[]>();
  for (const msg of messages) {
    const key = new Date(msg.createdAt).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(msg);
  }
  return Array.from(map.entries()).map(([, msgs]) => ({
    label: getDateLabel(msgs[0].createdAt),
    messages: msgs,
  }));
}

// ── props ─────────────────────────────────────────────────────────────────────
interface Props {
  messages: Message[];
  isLoading: boolean;
}

// ── component ─────────────────────────────────────────────────────────────────
export default function MessageList({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <svg className="w-5 h-5 animate-spin text-sky-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 gap-2 select-none">
        <MessageCircle className="w-8 h-8 text-neutral-300 dark:text-neutral-700" />
        <p className="text-sm text-neutral-400 dark:text-neutral-500 font-medium">No messages yet</p>
        <p className="text-xs text-neutral-300 dark:text-neutral-700">Be the first to say something!</p>
      </div>
    );
  }

  const groups = groupByDate(messages);

  return (
    <ScrollArea className="flex-1 min-h-0 bg-neutral-50 dark:bg-neutral-950">
      <div className="px-4 py-4">
        {groups.map((group) => (
          <div key={group.label}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-600 px-1">
                {group.label}
              </span>
              <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            </div>

            {/* Bubbles — showAvatar only on first message of each sender group */}
            {group.messages.map((msg, i) => {
              const prev = group.messages[i - 1];
              const showAvatar =
                !prev || prev.senderId._id !== msg.senderId._id;
              return (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  showAvatar={showAvatar}
                />
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} className="h-2" />
      </div>
    </ScrollArea>
  );
}