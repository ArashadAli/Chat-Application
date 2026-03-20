import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from "react";
import { Send, Paperclip, X, FileText, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadFileWorker } from "../../workers/fileUpload/uploadFile";
import CircularProgress from "../common/CircularProgress";

interface Props {
  recipientName: string;
  conversationId: string;
  isSending: boolean;
  onSend: (content: string) => Promise<void>;
  onFileSent: (message: any) => void;
}

const ACCEPTED = [
  "image/jpeg","image/jpg","image/png","application/pdf"
].join(",");

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type UploadState = "idle" | "uploading" | "done";

export default function MessageInput({
  recipientName,
  conversationId,
  isSending,
  onSend,
  onFileSent,
}: Props) {
  const [value, setValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isUploading = uploadState === "uploading";
  const isDone = uploadState === "done";
  const canSend = value.trim().length > 0 && !isSending && !isUploading;
  const canUpload = !!selectedFile && !isUploading && !isSending;

  // Auto-clear after done
  useEffect(() => {
    if (uploadState === "done") {
      const t = setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadState("idle");
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [uploadState]);

  async function handleSendText() {
    if (!canSend) return;
    const content = value.trim();
    setValue("");
    await onSend(content);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (selectedFile) handleUpload();
      else handleSendText();
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(0);
      setUploadState("idle");
    }
    e.target.value = "";
  }

  function clearFile() {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadState("idle");
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploadState("uploading");
    setUploadProgress(0);
    try {
      const res = await uploadFileWorker(conversationId, selectedFile, (pct) => {
        setUploadProgress(pct);
      });
      setUploadProgress(100);
      setUploadState("done");
      onFileSent(res.message);
    } catch {
      setUploadState("idle");
      setUploadProgress(0);
    }
  }

  const isImage = selectedFile?.type.startsWith("image/");

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">

      {/* ── File preview strip ── */}
      {selectedFile && (
        <div className="px-4 pt-3 pb-1">
          <div className={`
            flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-300
            ${isDone
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50"
              : isUploading
              ? "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/50"
              : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
            }
          `}>

            {/* Circular progress — replaces static icon during upload */}
            <div className="shrink-0 w-12 h-12 flex items-center justify-center">
              {isUploading || isDone ? (
                <CircularProgress
                  percent={uploadProgress}
                  size={44}
                  strokeWidth={3.5}
                  color="#0ea5e9"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-700 flex items-center justify-center">
                  {isImage
                    ? <ImageIcon className="w-5 h-5 text-sky-500" />
                    : <FileText className="w-5 h-5 text-violet-500" />
                  }
                </div>
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate mb-0.5">
                {selectedFile.name}
              </p>

              {isUploading ? (
                <div>
                  <p className="text-[11px] text-sky-500 font-medium">
                    Uploading… {uploadProgress}%
                  </p>
                  <p className="text-[10px] text-sky-400 mt-0.5">
                    {formatBytes(Math.round(selectedFile.size * uploadProgress / 100))} / {formatBytes(selectedFile.size)}
                  </p>
                </div>
              ) : isDone ? (
                <p className="text-[11px] text-emerald-500 font-semibold">
                  ✓ Upload complete — {formatBytes(selectedFile.size)}
                </p>
              ) : (
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  {formatBytes(selectedFile.size)} · {selectedFile.type.split("/")[1]?.toUpperCase()} · Ready to send
                </p>
              )}
            </div>

            {!isUploading && !isDone && (
              <button
                onClick={clearFile}
                className="shrink-0 p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Input row ── */}
      <div className="px-4 py-3 flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileRef.current?.click()}
          disabled={isUploading || isSending}
          title="Attach file"
          className="shrink-0 p-2 rounded-xl text-neutral-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedFile ? "Add a caption…" : `Message ${recipientName}…`}
          disabled={isUploading || isSending}
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
          onClick={selectedFile ? handleUpload : handleSendText}
          disabled={selectedFile ? !canUpload : !canSend}
          size="icon"
          className="
            w-10 h-10 rounded-xl shrink-0
            bg-sky-500 hover:bg-sky-600 active:scale-95
            text-white shadow-md shadow-sky-500/25
            disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed
            transition-all duration-150
          "
        >
          {isUploading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      <p className="pb-2 px-5 text-[10px] text-neutral-400 dark:text-neutral-600">
        Press <kbd className="font-mono bg-neutral-200 dark:bg-neutral-700 px-1 rounded text-[9px]">Enter</kbd> to send · Max 10MB
      </p>
    </div>
  );
}