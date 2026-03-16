import { useEffect, useRef } from "react";
import type { Message } from "../../schemas/chat/conversationDetailSchema";
import MessageBubble from "./MessageBubble";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Date separator ────────────────────────────────────────────────────────────

function formatDateLabel(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / 86_400_000
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return new Date(isoString).toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function groupByDate(messages: Message[]): { label: string; messages: Message[] }[] {
  const groups: Map<string, Message[]> = new Map();

  for (const msg of messages) {
    const key = new Date(msg.createdAt).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(msg);
  }

  return Array.from(groups.entries()).map(([key, msgs]) => ({
    label: formatDateLabel(msgs[0].createdAt),
    messages: msgs,
  }));
}


interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}


export default function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <svg className="w-5 h-5 animate-spin text-sky-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-1.5 select-none">
        <p className="text-sm text-neutral-400 dark:text-neutral-500 font-medium">
          No messages yet
        </p>
        <p className="text-xs text-neutral-300 dark:text-neutral-700">
          Send a message to start the conversation.
        </p>
      </div>
    );
  }

  const groups = groupByDate(messages);

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="px-4 py-4 flex flex-col gap-0">
        {groups.map((group, gi) => (
          <div key={group.label}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-3">
              <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-600 px-1">
                {group.label}
              </span>
              <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            </div>

            {/* Bubbles */}
            {group.messages.map((msg, mi) => {
              const isLastInGroup =
                gi === groups.length - 1 && mi === group.messages.length - 1;
              return (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isLast={isLastInGroup}
                />
              );
            })}
          </div>
        ))}

        {/* Scroll anchor */}
        <div ref={bottomRef} className="h-1" />
      </div>
    </ScrollArea>
  );
}