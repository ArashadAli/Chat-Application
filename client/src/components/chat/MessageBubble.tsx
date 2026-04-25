import { useState, useRef, useEffect } from "react";
import {
  Check, CheckCheck, FileText, Pencil,
  Trash2, X, Check as CheckIcon, Download
} from "lucide-react";
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

function resolveTick(message: Message, myId: string): MessageState {
  const recipientStatuses = message.status.filter((s) => s.userId !== myId);
  if (recipientStatuses.length === 0) return "sent";
  if (recipientStatuses.some((s) => s.state === "read")) return "read";
  if (recipientStatuses.some((s) => s.state === "delivered")) return "delivered";
  return "sent";
}

function TickIcon({ state }: { state: MessageState }) {
  if (state === "read") return <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />;
  if (state === "delivered") return <CheckCheck className="w-3.5 h-3.5 text-white/40" />;
  return <Check className="w-3.5 h-3.5 text-white/40" />;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const COLORS = [
  ["#ef4444","#dc2626"], ["#f97316","#ea580c"], ["#10b981","#059669"],
  ["#3b82f6","#2563eb"], ["#8b5cf6","#7c3aed"], ["#ec4899","#db2777"],
  ["#06b6d4","#0891b2"], ["#f59e0b","#d97706"],
];
function getColors(name: string) {
  let h = 0; for (const c of name) h += c.charCodeAt(0);
  return COLORS[h % COLORS.length];
}

// ── Context menu ──────────────────────────────────────────────────────────────
function ContextMenu({ messageType, position, onEdit, onDelete, onClose }: {
  messageType: string; position: { x: number; y: number };
  onEdit: () => void; onDelete: () => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div ref={ref} style={{ top: position.y, left: position.x }}
      className="fixed z-[999] min-w-[148px] py-1.5 rounded-2xl bg-white dark:bg-neutral-800 shadow-2xl shadow-black/20 border border-neutral-100 dark:border-neutral-700/60 overflow-hidden"
    >
      {messageType === "text" && (
        <button onClick={() => { onEdit(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5 text-indigo-500" /> Edit
        </button>
      )}
      <button onClick={() => { onDelete(); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" /> Delete
      </button>
    </div>
  );
}

// ── Image bubble ──────────────────────────────────────────────────────────────
function ImageBubble({ message }: { message: Message }) {
  const file = message.fileMetadata!;
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dlPct, setDlPct] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getFileViewUrl(file.fileName)
      .then((u) => { if (!cancelled) setImgUrl(u); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [file.fileName]);

  async function dl(e: React.MouseEvent) {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try { await downloadFileWorker(file.fileName, file.originalName, setDlPct); }
    finally { setDownloading(false); setDlPct(0); }
  }

  return (
    <div className="relative rounded-xl overflow-hidden cursor-pointer group" style={{ maxWidth: 240 }}
      onClick={() => imgUrl && window.open(imgUrl, "_blank")}>
      {loading ? (
        <div className="w-52 h-36 flex items-center justify-center bg-black/10 rounded-xl">
          <svg className="w-5 h-5 animate-spin text-white/60" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : imgUrl ? (
        <>
          <img src={imgUrl} alt={file.originalName} className="max-w-[240px] w-full object-cover block rounded-xl" loading="lazy"/>
          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-xl">
            <button onClick={dl} className="p-2.5 bg-white/20 backdrop-blur rounded-full border border-white/25 hover:bg-white/35 transition-colors">
              {downloading
                ? <CircularProgress percent={dlPct} size={32} strokeWidth={3} color="#fff" trackColor="rgba(255,255,255,0.2)"/>
                : <Download className="w-4 h-4 text-white"/>}
            </button>
          </div>
        </>
      ) : (
        <div className="w-40 h-24 flex items-center justify-center rounded-xl bg-black/10">
          <p className="text-xs text-white/50">Unavailable</p>
        </div>
      )}
    </div>
  );
}

// ── File bubble ───────────────────────────────────────────────────────────────
function FileBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const file = message.fileMetadata!;
  const [dlPct, setDlPct] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  async function dl(e: React.MouseEvent) {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true); setDone(false);
    try {
      await downloadFileWorker(file.fileName, file.originalName, setDlPct);
      setDone(true);
      setTimeout(() => { setDownloading(false); setDone(false); setDlPct(0); }, 1500);
    } catch { setDownloading(false); setDlPct(0); }
  }

  return (
    <div className="flex items-center gap-3" style={{ minWidth: 200, maxWidth: 260 }}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isOwn ? "bg-white/20" : "bg-indigo-100 dark:bg-indigo-500/20"}`}>
        {downloading
          ? <CircularProgress percent={dlPct} size={32} strokeWidth={3} color={isOwn ? "#fff" : "#6366f1"} trackColor={isOwn ? "rgba(255,255,255,0.2)" : "rgba(99,102,241,0.2)"}/>
          : <FileText className={`w-5 h-5 ${isOwn ? "text-white/80" : "text-indigo-500"}`}/>}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold truncate ${isOwn ? "text-white" : "text-neutral-800 dark:text-neutral-100"}`}>{file.originalName}</p>
        <p className={`text-[10px] mt-0.5 ${done ? "text-emerald-400" : downloading ? (isOwn ? "text-white/60" : "text-indigo-400") : (isOwn ? "text-white/50" : "text-neutral-400 dark:text-neutral-500")}`}>
          {done ? "✓ Saved" : downloading ? `${dlPct}%` : formatBytes(file.size)}
        </p>
      </div>
      <button onClick={dl} disabled={downloading}
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-40 ${isOwn ? "bg-white/15 hover:bg-white/25 text-white/70" : "bg-neutral-100 dark:bg-white/8 hover:bg-neutral-200 dark:hover:bg-white/12 text-neutral-500 dark:text-neutral-400"}`}>
        {!downloading && <Download className="w-3.5 h-3.5"/>}
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MessageBubble({ message, showAvatar, onMessageUpdated, onMessageDeleted }: Props) {
  const myId = useAuthStore((s) => s.user?._id ?? "");
  const sender = typeof message.senderId === "object" && message.senderId !== null
    ? message.senderId
    : { _id: String(message.senderId), username: "?", profilePic: "" };

  const isOwn = sender._id === myId;
  const tickState = isOwn ? resolveTick(message, myId) : null;
  const isFile = message.messageType === "file" || message.messageType === "image";
  const [c1, c2] = getColors(sender.username ?? "?");
  const initials = (sender.username ?? "?").slice(0, 2).toUpperCase();

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(message.content);
  const [saving, setSaving] = useState(false);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) { editRef.current?.focus(); editRef.current?.select(); } }, [editing]);

  function onCtx(e: React.MouseEvent) {
    if (!isOwn) return;
    e.preventDefault();
    setCtxMenu({ x: Math.min(e.clientX, window.innerWidth - 180), y: Math.min(e.clientY, window.innerHeight - 120) });
  }

  async function saveEdit() {
    const t = editVal.trim();
    if (!t || t === message.content) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await updateMsgWorker(message._id, t);
      onMessageUpdated(res.message);
      setEditing(false);
      toast.success("Updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed");
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    try {
      await deleteMsgWorker(message._id);
      onMessageDeleted(message._id);
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed");
    }
  }

  return (
    <>
      <div
        onContextMenu={onCtx}
        className={`flex items-end gap-2 px-3 sm:px-4 mb-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar slot */}
        <div className="w-8 h-8 shrink-0 self-end mb-0.5">
          {!isOwn && showAvatar && (
            <Avatar className="w-8 h-8 rounded-xl">
              <AvatarImage src={sender.profilePic} alt={sender.username} className="rounded-xl"/>
              <AvatarFallback className="rounded-xl text-white text-[10px] font-bold"
                style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Bubble column */}
        <div className={`flex flex-col gap-0.5 max-w-[68%] sm:max-w-[58%] lg:max-w-[50%] ${isOwn ? "items-end" : "items-start"}`}>

          {!isOwn && showAvatar && (
            <p className="text-[10px] font-bold px-1 leading-none mb-0.5" style={{ color: c1 }}>
              {sender.username}
            </p>
          )}

          <div className={[
            "relative rounded-2xl shadow-sm",
            isOwn ? "rounded-br-[4px]" : "rounded-bl-[4px]",
            isFile ? "px-3 py-2.5" : editing ? "px-3 py-2.5" : "px-4 pt-2.5 pb-6",
          ].join(" ")}
            style={isOwn ? { background: "linear-gradient(135deg, #6366f1, #4f46e5)" } : undefined}
          >
            {!isOwn && (
              <div className="absolute inset-0 rounded-2xl rounded-bl-[4px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/50 -z-10" />
            )}

            {isFile && (
              <div>
                {message.messageType === "image"
                  ? <ImageBubble message={message}/>
                  : <FileBubble message={message} isOwn={isOwn}/>
                }
                <div className="flex items-center justify-end gap-1 mt-2">
                  <span className={`text-[10px] tabular-nums ${isOwn ? "text-white/45" : "text-neutral-400 dark:text-neutral-500"}`}>
                    {formatTime(message.createdAt)}
                  </span>
                  {isOwn && tickState && <TickIcon state={tickState}/>}
                </div>
              </div>
            )}

            {!isFile && editing && (
              <div className="flex items-center gap-2" style={{ minWidth: 200 }}>
                <input ref={editRef} value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") { setEditing(false); setEditVal(message.content); } }}
                  disabled={saving}
                  className="flex-1 min-w-0 bg-white/25 text-white placeholder:text-white/40 rounded-lg px-2.5 py-1.5 text-sm outline-none border border-white/30 focus:border-white/60"
                />
                <button onClick={saveEdit} disabled={saving} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center shrink-0 transition-colors">
                  {saving
                    ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <CheckIcon className="w-3.5 h-3.5 text-white"/>}
                </button>
                <button onClick={() => { setEditing(false); setEditVal(message.content); }} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center shrink-0 transition-colors">
                  <X className="w-3.5 h-3.5 text-white"/>
                </button>
              </div>
            )}

            {!isFile && !editing && (
              <>
                <p className={`text-[13.5px] leading-relaxed break-words whitespace-pre-wrap ${isOwn ? "text-white" : "text-neutral-800 dark:text-neutral-100"}`}>
                  {message.content}
                </p>
                <div className="absolute bottom-1.5 right-3 flex items-center gap-1">
                  <span className={`text-[10px] tabular-nums leading-none ${isOwn ? "text-white/45" : "text-neutral-400 dark:text-neutral-500"}`}>
                    {formatTime(message.createdAt)}
                  </span>
                  {isOwn && tickState && <TickIcon state={tickState}/>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {ctxMenu && (
        <ContextMenu
          messageType={message.messageType}
          position={ctxMenu}
          onEdit={() => setEditing(true)}
          onDelete={handleDelete}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  );
}