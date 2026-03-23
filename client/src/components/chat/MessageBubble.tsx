import { useState, useRef, useEffect } from "react";
import { Check, CheckCheck, FileText, Pencil, Trash2, X, Check as CheckIcon } from "lucide-react";
import type { Message, MessageState } from "../../schemas/chat/conversationDetailSchema";
import { useAuthStore } from "../../store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { downloadFileWorker, getFileViewUrl } from "../../workers/fileUpload/uploadFile";
import { updateMsgWorker, deleteMsgWorker } from "../../workers/chat/message.actions";
import CircularProgress from "../common/CircularProgress";
import toast from "react-hot-toast";

interface Props {
  message: Message;
  showAvatar: boolean;
  onMessageUpdated: (updatedMessage: Message) => void;
  onMessageDeleted: (messageId: string) => void;
}

// ── Tick ──────────────────────────────────────────────────────────────────────

function resolveTick(message: Message, myId: string): MessageState {
  const recipientStatuses = message.status.filter((s) => s.userId !== myId);
  if (recipientStatuses.length === 0) return "sent";
  if (recipientStatuses.some((s) => s.state === "read")) return "read";
  if (recipientStatuses.some((s) => s.state === "delivered")) return "delivered";
  return "sent";
}

function TickIcon({ state }: { state: MessageState }) {
  if (state === "read") return <CheckCheck className="w-3.5 h-3.5 text-sky-300" />;
  if (state === "delivered") return <CheckCheck className="w-3.5 h-3.5 text-white/55" />;
  return <Check className="w-3.5 h-3.5 text-white/55" />;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
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

// ── Context menu ──────────────────────────────────────────────────────────────

interface ContextMenuProps {
  isOwn: boolean;
  messageType: string;
  position: { x: number; y: number };
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function ContextMenu({ isOwn, messageType, position, onEdit, onDelete, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[130px] rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xl shadow-black/10 overflow-hidden py-1"
      style={{ top: position.y, left: position.x }}
    >
      {/* Edit — only for own text messages */}
      {isOwn && messageType === "text" && (
        <button
          onClick={() => { onEdit(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5 text-sky-500" />
          Edit
        </button>
      )}

      {/* Delete — only for own messages */}
      {isOwn && (
        <button
          onClick={() => { onDelete(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      )}
    </div>
  );
}

// ── Image bubble ──────────────────────────────────────────────────────────────

function ImageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const file = message.fileMetadata!;
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getFileViewUrl(file.fileName)
      .then((url) => { if (!cancelled) setImgUrl(url); })
      .catch(() => { if (!cancelled) setImgUrl(null); })
      .finally(() => { if (!cancelled) setIsLoadingUrl(false); });
    return () => { cancelled = true; };
  }, [file.fileName]);

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    try {
      await downloadFileWorker(file.fileName, file.originalName, (pct) => setDownloadProgress(pct));
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        className="relative rounded-xl overflow-hidden max-w-[260px] cursor-pointer group bg-neutral-200 dark:bg-neutral-700 min-h-[120px] flex items-center justify-center"
        onClick={() => imgUrl && window.open(imgUrl, "_blank")}
      >
        {isLoadingUrl ? (
          <div className="w-full h-32 flex items-center justify-center">
            <svg className="w-5 h-5 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : imgUrl ? (
          <>
            <img src={imgUrl} alt={file.originalName} className="w-full object-cover rounded-xl" loading="lazy" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
              <button onClick={handleDownload}>
                {isDownloading
                  ? <CircularProgress percent={downloadProgress} size={44} strokeWidth={3} color="#ffffff" trackColor="rgba(255,255,255,0.2)" />
                  : <div className="p-2 bg-white/20 backdrop-blur rounded-full hover:bg-white/30 transition-colors">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                }
              </button>
            </div>
          </>
        ) : (
          <p className="text-xs text-neutral-400 p-4">Image unavailable</p>
        )}
      </div>
      {message.content && message.content !== file.originalName && (
        <p className={`text-sm ${isOwn ? "text-white/90" : "text-neutral-800 dark:text-neutral-200"}`}>
          {message.content}
        </p>
      )}
    </div>
  );
}

// ── File bubble ───────────────────────────────────────────────────────────────

function FileBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const file = message.fileMetadata!;
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadDone(false);
    try {
      await downloadFileWorker(file.fileName, file.originalName, (pct) => setDownloadProgress(pct));
      setDownloadDone(true);
      setTimeout(() => { setIsDownloading(false); setDownloadDone(false); setDownloadProgress(0); }, 1500);
    } catch {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  }

  return (
    <div className="flex items-center gap-3 min-w-[220px] max-w-[280px] p-1">
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${isOwn ? "bg-white/20" : "bg-neutral-100 dark:bg-neutral-700"}`}>
        {isDownloading
          ? <CircularProgress percent={downloadProgress} size={36} strokeWidth={3} color={isOwn ? "#ffffff" : "#0ea5e9"} trackColor={isOwn ? "rgba(255,255,255,0.2)" : "#e2e8f0"} />
          : <FileText className={`w-5 h-5 ${isOwn ? "text-white" : "text-violet-500"}`} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold truncate ${isOwn ? "text-white" : "text-neutral-900 dark:text-white"}`}>{file.originalName}</p>
        <p className={`text-[10px] mt-0.5 ${downloadDone ? "text-emerald-400 font-medium" : isDownloading ? (isOwn ? "text-white/60" : "text-sky-500") : (isOwn ? "text-white/50" : "text-neutral-400 dark:text-neutral-500")}`}>
          {downloadDone ? "✓ Downloaded" : isDownloading ? `${downloadProgress}% — ${formatBytes(Math.round(file.size * downloadProgress / 100))} / ${formatBytes(file.size)}` : formatBytes(file.size)}
        </p>
      </div>
      <button onClick={handleDownload} disabled={isDownloading} className={`shrink-0 p-1.5 rounded-lg transition-colors ${isOwn ? "hover:bg-white/20 text-white/70 hover:text-white" : "hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-400"}`}>
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

export default function MessageBubble({ message, showAvatar, onMessageUpdated, onMessageDeleted }: Props) {
  const myId = useAuthStore((s) => s.user?._id ?? "");

  const sender =
    typeof message.senderId === "object" && message.senderId !== null
      ? message.senderId
      : { _id: String(message.senderId), username: "?", profilePic: "" };

  const isOwn = sender._id === myId;
  const tickState = isOwn ? resolveTick(message, myId) : null;
  const initials = (sender.username ?? "?").slice(0, 2).toUpperCase();
  const isFileMessage = message.messageType === "file" || message.messageType === "image";

  // ── Context menu state ────────────────────────────────────────────────────
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  function handleContextMenu(e: React.MouseEvent) {
    if (!isOwn) return; // Sirf apne messages pe context menu
    e.preventDefault();
    // Menu ko screen ke andar rakhne ke liye adjust karo
    const x = Math.min(e.clientX, window.innerWidth - 160);
    const y = Math.min(e.clientY, window.innerHeight - 100);
    setContextMenu({ x, y });
  }

  // ── Edit state ────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [isEditing]);

  async function handleSaveEdit() {
    if (!editValue.trim() || editValue.trim() === message.content) {
      setIsEditing(false);
      return;
    }
    setIsSavingEdit(true);
    try {
      const res = await updateMsgWorker(message._id, editValue.trim());
      onMessageUpdated(res.message);
      setIsEditing(false);
      toast.success("Message updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to update");
    } finally {
      setIsSavingEdit(false);
    }
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSaveEdit();
    if (e.key === "Escape") { setIsEditing(false); setEditValue(message.content); }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    try {
      await deleteMsgWorker(message._id);
      onMessageDeleted(message._id);
      toast.success("Message deleted");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to delete");
    }
  }

  return (
    <>
      <div
        className={`flex items-end gap-2 mb-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
        onContextMenu={handleContextMenu}
      >
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
          ${isFileMessage ? "px-3 py-2.5" : isEditing ? "px-3 py-2" : "px-3.5 pt-2 pb-[22px]"}
          max-w-[70%] sm:max-w-[58%] lg:max-w-[50%]
          ${isOwn
            ? "bg-sky-500 text-white rounded-br-[4px]"
            : "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-[4px] border border-neutral-100 dark:border-neutral-700/60"
          }
          ${isOwn ? "cursor-context-menu" : ""}
        `}>

          {!isOwn && showAvatar && (
            <p className="text-[10px] font-semibold text-sky-500 dark:text-sky-400 mb-1 leading-none">
              {sender.username}
            </p>
          )}

          {isFileMessage ? (
            <div>
              {message.messageType === "image"
                ? <ImageBubble message={message} isOwn={isOwn} />
                : <FileBubble message={message} isOwn={isOwn} />
              }
              <div className="flex items-center justify-end gap-1 mt-1.5">
                <span className={`text-[10px] tabular-nums leading-none ${isOwn ? "text-white/55" : "text-neutral-400 dark:text-neutral-500"}`}>
                  {formatTime(message.createdAt)}
                </span>
                {isOwn && tickState && <TickIcon state={tickState} />}
              </div>
            </div>
          ) : isEditing ? (
            // ── Edit mode UI ──────────────────────────────────────────────
            <div className="flex items-center gap-2 min-w-[180px]">
              <input
                ref={editInputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                disabled={isSavingEdit}
                className="flex-1 bg-white/20 text-white placeholder:text-white/50 rounded-lg px-2 py-1 text-sm outline-none border border-white/30 focus:border-white/60 min-w-0"
              />
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="shrink-0 p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                {isSavingEdit
                  ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : <CheckIcon className="w-3.5 h-3.5 text-white" />
                }
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditValue(message.content); }}
                className="shrink-0 p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ) : (
            // ── Normal text message ───────────────────────────────────────
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

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          isOwn={isOwn}
          messageType={message.messageType}
          position={contextMenu}
          onEdit={() => setIsEditing(true)}
          onDelete={handleDelete}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}