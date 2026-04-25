import { useEffect, useRef } from "react";
import type { Message } from "../../schemas/chat/conversationDetailSchema";
import MessageBubble from "./MessageBubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle } from "lucide-react";

function getDateLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (new Date(now.toDateString()).getTime() - new Date(date.toDateString()).getTime()) / 86_400_000
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "long" });
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
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

interface Props {
  messages: Message[];
  isLoading: boolean;
  onMessageUpdated: (updatedMessage: Message) => void;
  onMessageDeleted: (messageId: string) => void;
}

export default function MessageList({ messages, isLoading, onMessageUpdated, onMessageDeleted }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-50 dark:bg-[#111111]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-100 dark:border-indigo-900/60" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
          </div>
          <p className="text-xs font-medium text-neutral-400 dark:text-neutral-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50 dark:bg-[#111111] select-none gap-3">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
          <MessageCircle className="w-7 h-7 text-indigo-400 dark:text-indigo-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">No messages yet</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-1">Say hello — start the conversation!</p>
        </div>
      </div>
    );
  }

  const groups = groupByDate(messages);

  return (
    <ScrollArea className="flex-1 min-h-0 bg-neutral-50 dark:bg-[#111111]">
      <div className="py-4">
        {groups.map((group) => (
          <div key={group.label}>
            {/* Date pill */}
            <div className="flex items-center gap-3 px-4 my-4">
              <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              <span className="text-[10px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-600 px-3 py-1 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 shadow-sm">
                {group.label}
              </span>
              <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            </div>

            {/* Message rows */}
            {group.messages.map((msg, i) => {
              const prev = group.messages[i - 1];
              const showAvatar = !prev || prev.senderId._id !== msg.senderId._id;
              return (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  showAvatar={showAvatar}
                  onMessageUpdated={onMessageUpdated}
                  onMessageDeleted={onMessageDeleted}
                />
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} className="h-3" />
      </div>
    </ScrollArea>
  );
}