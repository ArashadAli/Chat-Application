import { useState } from "react";
import { Check, CheckCheck, FileText } from "lucide-react";
import type { Message, MessageState } from "../../schemas/chat/conversationDetailSchema";
import { useAuthStore } from "../../store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { downloadFileWorker } from "../../workers/fileUpload/uploadFile";
import CircularProgress from "../common/CircularProgress";

interface Props {
  message: Message;
  showAvatar: boolean;
}


function resolveTick(message: Message, myId: string): MessageState {
  const recipientStatuses = message.status.filter((s) => s.userId !== myId);
  if (recipientStatuses.length === 0) return "sent";
  if (recipientStatuses.some((s) => s.state === "read")) return "read";
  if (recipientStatuses.some((s) => s.state === "delivered")) return "delivered";
  return "sent";
}

function TickIcon({ state }: { state: MessageState }) {
  if (state === "read")      return <CheckCheck className="w-3.5 h-3.5 text-sky-300" />;
  if (state === "delivered") return <CheckCheck className="w-3.5 h-3.5 text-white/55" />;
  return <Check className="w-3.5 h-3.5 text-white/55" />;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function avatarGradient(name: string) {
  const palette = [
    "from-rose-400 to-pink-500", "from-orange-400 to-amber-500",
    "from-emerald-400 to-teal-500", "from-sky-400 to-blue-500",
    "from-violet-400 to-purple-500",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return palette[h % palette.length];
}

// ── File bubble ───────────────────────────────────────────────────────────────

function FileBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const file = message.fileMetadata!;
  const isImage = message.messageType === "image";
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  async function handleDownload(e?: React.MouseEvent) {
    e?.stopPropagation();
    if (isDownloading) return;

    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadDone(false);

    try {
      await downloadFileWorker(file.fileName, file.originalName, (pct) => {
        setDownloadProgress(pct);
      });
      setDownloadProgress(100);
      setDownloadDone(true);
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadDone(false);
        setDownloadProgress(0);
      }, 1500);
    } catch {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  }

  // ── Image message ──────────────────────────────────────────────────────────
  if (isImage) {
    return (
      <div className="flex flex-col gap-1">
        <div
          className="relative rounded-xl overflow-hidden max-w-[260px] cursor-pointer group"
          onClick={() => window.open(file.url, "_blank")}
        >
          <img
            src={file.url}
            alt={file.originalName}
            className="w-full object-cover rounded-xl"
            loading="lazy"
          />

          {/* Hover overlay with circular download progress */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
            <button
              onClick={handleDownload}
              className="flex flex-col items-center gap-1"
            >
              {isDownloading ? (
                <CircularProgress
                  percent={downloadProgress}
                  size={44}
                  strokeWidth={3}
                  color="#ffffff"
                  trackColor="rgba(255,255,255,0.2)"
                />
              ) : (
                <div className="p-2 bg-white/20 backdrop-blur rounded-full hover:bg-white/30 transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </div>

        {message.content && message.content !== file.originalName && (
          <p className={`text-sm ${isOwn ? "text-white/90" : "text-neutral-800 dark:text-neutral-200"}`}>
            {message.content}
          </p>
        )}
      </div>
    );
  }

  // ── Non-image file ─────────────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-3 min-w-[220px] max-w-[280px] p-1">

      {/* Icon / circular progress */}
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${isOwn ? "bg-white/20" : "bg-neutral-100 dark:bg-neutral-700"}`}>
        {isDownloading ? (
          <CircularProgress
            percent={downloadProgress}
            size={36}
            strokeWidth={3}
            color={isOwn ? "#ffffff" : "#0ea5e9"}
            trackColor={isOwn ? "rgba(255,255,255,0.2)" : "#e2e8f0"}
          />
        ) : (
          <FileText className={`w-5 h-5 ${isOwn ? "text-white" : "text-violet-500"}`} />
        )}
      </div>

      {/* Name + size / progress text */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold truncate ${isOwn ? "text-white" : "text-neutral-900 dark:text-white"}`}>
          {file.originalName}
        </p>
        <p className={`text-[10px] mt-0.5 transition-colors ${
          downloadDone
            ? "text-emerald-400 font-medium"
            : isDownloading
            ? (isOwn ? "text-white/60" : "text-sky-500")
            : (isOwn ? "text-white/50" : "text-neutral-400 dark:text-neutral-500")
        }`}>
          {downloadDone
            ? "✓ Downloaded"
            : isDownloading
            ? `${downloadProgress}% — ${formatBytes(Math.round(file.size * downloadProgress / 100))} / ${formatBytes(file.size)}`
            : formatBytes(file.size)
          }
        </p>
      </div>

      {/* Download trigger button */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        title="Download"
        className={`shrink-0 p-1.5 rounded-lg transition-colors disabled:cursor-not-allowed ${
          isOwn
            ? "hover:bg-white/20 text-white/70 hover:text-white"
            : "hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-400 dark:text-neutral-400 hover:text-neutral-600"
        }`}
      >
        {!isDownloading && (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MessageBubble({ message, showAvatar }: Props) {
  const myId = useAuthStore((s) => s.user?._id ?? "");

  const sender =
    typeof message.senderId === "object" && message.senderId !== null
      ? message.senderId
      : { _id: String(message.senderId), username: "?", profilePic: "" };

  const isOwn = sender._id === myId;
  const tickState = isOwn ? resolveTick(message, myId) : null;
  const initials = (sender.username ?? "?").slice(0, 2).toUpperCase();
  const isFileMessage = message.messageType === "file" || message.messageType === "image";

  return (
    <div className={`flex items-end gap-2 mb-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>

      {/* Avatar */}
      <div className="w-7 shrink-0 self-end mb-0.5">
        {!isOwn && showAvatar ? (
          <Avatar className="w-7 h-7">
            <AvatarImage src={sender.profilePic} alt={sender.username} />
            <AvatarFallback className={`bg-gradient-to-br ${avatarGradient(sender.username ?? "?")} text-white text-[9px] font-bold`}>
              {initials}
            </AvatarFallback>
          </Avatar>
        ) : null}
      </div>

      {/* Bubble */}
      <div className={`
        relative rounded-2xl shadow-sm
        ${isFileMessage ? "px-3 py-2.5" : "px-3.5 pt-2 pb-[22px]"}
        max-w-[70%] sm:max-w-[58%] lg:max-w-[50%]
        ${isOwn
          ? "bg-sky-500 text-white rounded-br-[4px]"
          : "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-[4px] border border-neutral-100 dark:border-neutral-700/60"
        }
      `}>

        {!isOwn && showAvatar && (
          <p className="text-[10px] font-semibold text-sky-500 dark:text-sky-400 mb-1 leading-none">
            {sender.username}
          </p>
        )}

        {isFileMessage ? (
          <div>
            <FileBubble message={message} isOwn={isOwn} />
            <div className="flex items-center justify-end gap-1 mt-1.5">
              <span className={`text-[10px] tabular-nums leading-none ${isOwn ? "text-white/55" : "text-neutral-400 dark:text-neutral-500"}`}>
                {formatTime(message.createdAt)}
              </span>
              {isOwn && tickState && <TickIcon state={tickState} />}
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
              {message.content}
            </p>
            <div className="absolute bottom-1.5 right-2.5 flex items-center gap-1">
              <span className={`text-[10px] tabular-nums leading-none ${isOwn ? "text-white/55" : "text-neutral-400 dark:text-neutral-500"}`}>
                {formatTime(message.createdAt)}
              </span>
              {isOwn && tickState && <TickIcon state={tickState} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}