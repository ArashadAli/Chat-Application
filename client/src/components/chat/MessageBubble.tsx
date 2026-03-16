import type { Message, MessageState } from "../../schemas/chat/conversationDetailSchema";
import { useAuthStore } from "../../store/authStore";

interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
}

const SentTick = () => (
  <svg
    aria-label="Sent"
    className="w-3.5 h-[11px] shrink-0 text-white/55"
    viewBox="0 0 14 11"
    fill="none"
  >
    <path
      d="M1.5 5.5L5.5 9.5L12.5 1.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);


const DeliveredTick = () => (
  <svg
    aria-label="Delivered"
    className="w-[18px] h-[11px] shrink-0 text-white/55"
    viewBox="0 0 18 11"
    fill="none"
  >
    <path d="M1.5 5.5L5.5 9.5L12.5 1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.5 5.5L10.5 9.5L17.5 1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Double blue tick — read */
const ReadTick = () => (
  <svg
    aria-label="Read"
    className="w-[18px] h-[11px] shrink-0 text-sky-200"
    viewBox="0 0 18 11"
    fill="none"
  >
    <path d="M1.5 5.5L5.5 9.5L12.5 1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.5 5.5L10.5 9.5L17.5 1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Tick resolver ─────────────────────────────────────────────────────────────

/**
 * Checks recipient statuses only (excludes senderId).
 * Priority: read > delivered > sent
 */
function resolveTick(message: Message, myId: string): MessageState {
  const recipientStatuses = message.status.filter((s) => s.userId !== myId);
  if (recipientStatuses.length === 0) return "sent";
  if (recipientStatuses.some((s) => s.state === "read")) return "read";
  if (recipientStatuses.some((s) => s.state === "delivered")) return "delivered";
  return "sent";
}

function TickIcon({ state }: { state: MessageState }) {
  if (state === "read") return <ReadTick />;
  if (state === "delivered") return <DeliveredTick />;
  return <SentTick />;
}

// ── Time formatter ────────────────────────────────────────────────────────────

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MessageBubble({ message, isLast }: MessageBubbleProps) {
  const myId = useAuthStore((s) => s.user?._id ?? "");
  const isOwn = message.senderId._id === myId;
  const tickState = isOwn ? resolveTick(message, myId) : null;

  return (
    <div
      className={`
        flex ${isOwn ? "justify-end" : "justify-start"}
        ${isLast ? "mb-0" : "mb-1"}
      `}
    >
      <div
        className={`
          relative max-w-[72%] sm:max-w-[60%] lg:max-w-[52%]
          px-3.5 pt-2 pb-[22px]
          rounded-2xl shadow-sm
          ${
            isOwn
              ? "bg-sky-500 text-white rounded-br-[4px]"
              : "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-100 dark:border-neutral-700/60 rounded-bl-[4px]"
          }
        `}
      >
        {/* Message text */}
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
          {message.content}
        </p>

        {/* Meta row: time + tick anchored to bottom-right */}
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