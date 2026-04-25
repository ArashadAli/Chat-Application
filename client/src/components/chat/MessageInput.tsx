import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from "react";
import { Send, Paperclip, X, FileText, ImageIcon } from "lucide-react";
import { uploadFileWorker } from "../../workers/fileUpload/uploadFile";
import CircularProgress from "../common/CircularProgress";
import { useAuthStore } from "@/store/authStore";

interface Props {
  recipientName: string;
  conversationId: string;
  isSending: boolean;
  onSend: (content: string) => Promise<void>;
  onFileSent: (message: any) => void;
}

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "application/pdf"].join(",");

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type UploadState = "idle" | "uploading" | "done";

export default function MessageInput({ recipientName, conversationId, isSending, onSend, onFileSent }: Props) {
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploading = uploadState === "uploading";
  const done = uploadState === "done";
  const canSend = value.trim().length > 0 && !isSending && !uploading;
  const canUpload = !!file && !uploading && !isSending;
  const isImage = file?.type.startsWith("image/");

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => { setFile(null); setProgress(0); setUploadState("idle"); }, 900);
      return () => clearTimeout(t);
    }
  }, [done]);

  async function handleSend() {
    if (!canSend) return;
    const content = value.trim();
    setValue("");
    await onSend(content);
    inputRef.current?.focus();
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (file) handleUpload();
      else handleSend();
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setProgress(0); setUploadState("idle"); }
    e.target.value = "";
  }

  async function handleUpload() {
    if (!file) return;
    setUploadState("uploading");
    setProgress(0);
    try {
      const res = await uploadFileWorker(conversationId, file, setProgress);
      setProgress(100);
      setUploadState("done");
      onFileSent(res.message);
    } catch { setUploadState("idle"); setProgress(0); }
  }

  return (
    <div className="shrink-0 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">

      {/* File preview strip */}
      {file && (
        <div className="px-3 sm:px-4 pt-3 pb-1">
          <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border transition-all duration-300 ${
            done
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40"
              : uploading
              ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/40"
              : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
          }`}>
            <div className="shrink-0 w-10 h-10 flex items-center justify-center">
              {uploading || done ? (
                <CircularProgress
                  percent={progress} size={40} strokeWidth={3.5}
                  color={done ? "#10b981" : "#6366f1"}
                  trackColor={done ? "rgba(16,185,129,0.15)" : "rgba(99,102,241,0.15)"}
                />
              ) : (
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isImage ? "bg-indigo-50 dark:bg-indigo-500/15" : "bg-violet-50 dark:bg-violet-500/15"}`}>
                  {isImage
                    ? <ImageIcon className="w-5 h-5 text-indigo-500"/>
                    : <FileText className="w-5 h-5 text-violet-500"/>}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">{file.name}</p>
              <p className={`text-[10px] mt-0.5 ${
                done ? "text-emerald-500 font-semibold"
                : uploading ? "text-indigo-500"
                : "text-neutral-400 dark:text-neutral-500"
              }`}>
                {done ? "✓ Sent" : uploading ? `Uploading ${progress}% · ${formatBytes(Math.round(file.size * progress / 100))} of ${formatBytes(file.size)}` : `${formatBytes(file.size)} · ${file.type.split("/")[1]?.toUpperCase()}`}
              </p>
            </div>

            {!uploading && !done && (
              <button onClick={() => { setFile(null); setProgress(0); setUploadState("idle"); }}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all shrink-0">
                <X className="w-3.5 h-3.5"/>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-3">
        <input ref={fileRef} type="file" accept={ACCEPTED} onChange={handleFileChange} className="hidden"/>

        {/* Attach */}
        <button onClick={() => fileRef.current?.click()} disabled={uploading || isSending}
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 active:scale-90 disabled:opacity-40 transition-all duration-150">
          <Paperclip className="w-4 h-4"/>
        </button>

        {/* Text */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder={file ? "Add a caption…" : `Message ${recipientName}…`}
          disabled={uploading || isSending}
          autoFocus
          className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 border border-transparent outline-none focus:bg-white dark:focus:bg-neutral-800 focus:border-indigo-200 dark:focus:border-indigo-500/30 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/10 disabled:opacity-50 transition-all duration-200"
        />

        {/* Send */}
        <button
          onClick={file ? handleUpload : handleSend}
          disabled={file ? !canUpload : !canSend}
          className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-all duration-200 disabled:opacity-40 disabled:shadow-none disabled:scale-100 ${
            (file ? canUpload : canSend)
              ? "bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105"
              : "bg-neutral-200 dark:bg-neutral-700"
          }`}
        >
          {uploading
            ? <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            : <Send className={`w-3.5 h-3.5 ${(file ? canUpload : canSend) ? "text-white" : "text-neutral-400 dark:text-neutral-500"}`}/>
          }
        </button>
      </div>

      <p className="pb-2 px-5 text-[10px] text-neutral-300 dark:text-neutral-700 select-none">
        <kbd className="font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded text-[9px] border border-neutral-200 dark:border-neutral-700">↵</kbd>
        {" "}to send · Max 10 MB
      </p>
    </div>
  );
}