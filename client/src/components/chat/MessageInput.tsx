import { useState, useRef, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  recipientName: string;
  isSending: boolean;
  onSend: (content: string) => Promise<void>;
}

export default function MessageInput({ recipientName, isSending, onSend }: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const canSend = value.trim().length > 0 && !isSending;

  async function handleSend() {
    if (!canSend) return;
    const content = value.trim();
    setValue("");
    await onSend(content);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${recipientName}…`}
          disabled={isSending}
          autoFocus
          className="
            flex-1 px-4 py-2.5 rounded-xl text-sm
            bg-neutral-100 dark:bg-neutral-800
            border border-transparent
            text-neutral-900 dark:text-white
            placeholder:text-neutral-400 dark:placeholder:text-neutral-600
            outline-none transition-all duration-150
            focus:ring-2 focus:ring-sky-400/30 focus:bg-white dark:focus:bg-neutral-800
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        />
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="icon"
          className="
            w-10 h-10 rounded-xl shrink-0
            bg-sky-500 hover:bg-sky-600 active:scale-95
            text-white shadow-md shadow-sky-500/25
            disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed
            transition-all duration-150
          "
        >
          {isSending ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
      <p className="mt-1.5 text-[10px] text-neutral-400 dark:text-neutral-600 pl-1">
        Press <kbd className="font-mono bg-neutral-200 dark:bg-neutral-700 px-1 rounded text-[9px]">Enter</kbd> to send
      </p>
    </div>
  );
}