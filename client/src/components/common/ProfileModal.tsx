import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Camera, Pencil, Trash2, X, Check, Loader2, User } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "../../hooks/useProfile";

interface Props {
  isOpen: boolean;
  onClose: () => void;
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

// ─────────────────────────────────────────────────────────────
//  Canvas Cropper — portal on body, no parent behind it
// ─────────────────────────────────────────────────────────────
const CANVAS_SIZE = 280;
const CIRCLE_R    = 110;

interface CropperProps {
  imageSrc: string;
  onConfirm: (file: File, previewUrl: string) => void;
  onCancel: () => void;
}

function ImageCropper({ imageSrc, onConfirm, onCancel }: CropperProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const imgRef     = useRef<HTMLImageElement | null>(null);
  const offsetRef  = useRef({ x: 0, y: 0 });
  const scaleRef   = useRef(1);
  const dragging   = useRef(false);
  const lastPos    = useRef({ x: 0, y: 0 });
  const minZoomRef = useRef(1);

  const [zoom, setZoom]                 = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loaded, setLoaded]             = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const s  = scaleRef.current;
    const cx = CANVAS_SIZE / 2 + offsetRef.current.x;
    const cy = CANVAS_SIZE / 2 + offsetRef.current.y;
    ctx.drawImage(img, cx - (img.naturalWidth * s) / 2, cy - (img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CIRCLE_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(99,102,241,1)";
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CIRCLE_R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, []);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current     = img;
      const minS         = (CIRCLE_R * 2) / Math.min(img.naturalWidth, img.naturalHeight);
      minZoomRef.current = minS;
      scaleRef.current   = minS;
      offsetRef.current  = { x: 0, y: 0 };
      setZoom(minS);
      setLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    if (!loaded) return;
    scaleRef.current = zoom;
    draw();
  }, [zoom, loaded, draw]);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const rect   = canvasRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const src    = "touches" in e ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY };
  }

  function onDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault(); dragging.current = true; lastPos.current = getPos(e);
  }
  function onMove(e: React.MouseEvent | React.TouchEvent) {
    if (!dragging.current) return;
    e.preventDefault();
    const pos = getPos(e);
    offsetRef.current = { x: offsetRef.current.x + (pos.x - lastPos.current.x), y: offsetRef.current.y + (pos.y - lastPos.current.y) };
    lastPos.current = pos;
    draw();
  }
  function onUp() { dragging.current = false; }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom((z) => Math.min(4, Math.max(minZoomRef.current, z - e.deltaY * 0.001)));
  }

  async function handleConfirm() {
    const img = imgRef.current;
    if (!img) return;
    setIsProcessing(true);
    try {
      const size = CIRCLE_R * 2;
      const out  = document.createElement("canvas");
      out.width = size; out.height = size;
      const ctx = out.getContext("2d")!;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      const s    = scaleRef.current;
      const imgX = CANVAS_SIZE / 2 + offsetRef.current.x - (img.naturalWidth  * s) / 2;
      const imgY = CANVAS_SIZE / 2 + offsetRef.current.y - (img.naturalHeight * s) / 2;
      const left = CANVAS_SIZE / 2 - CIRCLE_R;
      const top  = CANVAS_SIZE / 2 - CIRCLE_R;
      ctx.drawImage(img, (left - imgX) / s, (top - imgY) / s, size / s, size / s, 0, 0, size, size);
      out.toBlob((blob) => {
        if (!blob) { setIsProcessing(false); return; }
        const file    = new File([blob], "profile.jpg", { type: "image/jpeg" });
        const preview = URL.createObjectURL(blob);
        onConfirm(file, preview);
        setIsProcessing(false);
      }, "image/jpeg", 0.92);
    } catch { setIsProcessing(false); }
  }

  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)" }}
    >
      <div className="bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col" style={{ width: 320 }}>

        <div className="px-5 pt-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Adjust photo</h3>
          <p className="text-[11px] text-neutral-400 mt-0.5">Drag to reposition · Scroll or slider to zoom</p>
        </div>

        <div className="flex items-center justify-center bg-neutral-950 py-4">
          {!loaded && (
            <div style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }} className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, cursor: "grab", touchAction: "none", userSelect: "none", borderRadius: 12, display: loaded ? "block" : "none" }}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={onDown}
            onTouchMove={onMove}
            onTouchEnd={onUp}
            onWheel={onWheel}
          />
        </div>

        <div className="px-5 pt-3 pb-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Zoom</span>
            <span className="text-[11px] text-neutral-400 font-mono">{zoom.toFixed(2)}×</span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setZoom((z) => Math.max(minZoomRef.current, parseFloat((z - 0.1).toFixed(2))))}
              className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-bold text-base leading-none select-none">−</button>
            <input type="range" min={minZoomRef.current} max={4} step={0.01} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-indigo-500 cursor-pointer" />
            <button type="button" onClick={() => setZoom((z) => Math.min(4, parseFloat((z + 0.1).toFixed(2))))}
              className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-bold text-base leading-none select-none">+</button>
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5 pt-2">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={isProcessing || !loaded}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {isProcessing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</> : <><Check className="w-3.5 h-3.5" /> Apply</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────
//  ProfileModal
// ─────────────────────────────────────────────────────────────
export default function ProfileModal({ isOpen, onClose }: Props) {
  const { user, isSaving, updateProfile, removeProfilePic } = useProfile();

  const [username, setUsername]         = useState(user?.username ?? "");
  const [quote, setQuote]               = useState((user as any)?.quote ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]     = useState<string | null>(null);
  const [editingName, setEditingName]   = useState(false);
  const [editingQuote, setEditingQuote] = useState(false);
  const [showCropper, setShowCropper]   = useState(false);  // jab true ho, Dialog band
  const [rawImageSrc, setRawImageSrc]   = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUsername(user?.username ?? "");
      setQuote((user as any)?.quote ?? "");
      setSelectedFile(null);
      setPreviewUrl(null);
      setEditingName(false);
      setEditingQuote(false);
      setShowCropper(false);
      setRawImageSrc(null);
    }
  }, [isOpen, user]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawImageSrc(URL.createObjectURL(file));
    setShowCropper(true);   // Dialog automatically band ho jayega (open={isOpen && !showCropper})
    e.target.value = "";
  }

  function handleCropConfirm(file: File, preview: string) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(preview);
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setRawImageSrc(null);
    setShowCropper(false);  // Dialog wapas khul jayega
  }

  function handleCropCancel() {
    if (rawImageSrc) { URL.revokeObjectURL(rawImageSrc); setRawImageSrc(null); }
    setShowCropper(false);  // Dialog wapas khul jayega
  }

  function handleReadjust() {
    if (!previewUrl) return;
    setRawImageSrc(previewUrl);
    setShowCropper(true);
  }

  function clearSelectedFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
  }

  async function handleSave() {
    const payload: { username?: string; quote?: string; profilePic?: File } = {};
    if (username.trim() !== user?.username) payload.username = username.trim();
    if (quote.trim() !== ((user as any)?.quote ?? "")) payload.quote = quote.trim();
    if (selectedFile) payload.profilePic = selectedFile;
    if (Object.keys(payload).length === 0) { onClose(); return; }
    const ok = await updateProfile(payload);
    if (ok) { clearSelectedFile(); onClose(); }
  }

  async function handleRemovePic() {
    const ok = await removeProfilePic();
    if (ok) clearSelectedFile();
  }

  const displayPic = previewUrl ?? user?.profilePic ?? "";
  const [c1, c2]   = getColors(user?.username ?? "?");
  const initials   = (user?.username ?? "?").slice(0, 2).toUpperCase();
  const hasChanges =
    username.trim() !== user?.username ||
    quote.trim() !== ((user as any)?.quote ?? "") ||
    !!selectedFile;

  return (
    <>
      {/* ── Dialog: sirf tab open jab cropper band ho ── */}
      <Dialog open={isOpen && !showCropper} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="p-0 gap-0 max-w-sm w-full rounded-3xl overflow-hidden border-0 bg-white dark:bg-neutral-900 shadow-2xl">

          <div className="relative px-6 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">Edit Profile</h2>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Update your name, quote and photo</p>
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">

            {/* Profile picture */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <Avatar className="w-24 h-24 rounded-3xl shadow-lg">
                  <AvatarImage src={displayPic} alt={user?.username} className="rounded-3xl object-cover" />
                  <AvatarFallback className="rounded-3xl text-white text-2xl font-bold" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button onClick={() => fileRef.current?.click()} className="absolute inset-0 rounded-3xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </button>
                {selectedFile && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>

              <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleFileChange} className="hidden" />

              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 transition-colors">
                  <Camera className="w-3 h-3" />{selectedFile ? "Change" : "Upload photo"}
                </button>
                {selectedFile && (
                  <button onClick={handleReadjust} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                    ✂ Adjust
                  </button>
                )}
                {selectedFile && (
                  <button onClick={clearSelectedFile} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                    <X className="w-3 h-3" /> Cancel
                  </button>
                )}
                {!selectedFile && user?.profilePic && (
                  <button onClick={handleRemovePic} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors disabled:opacity-50">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Name</label>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input autoFocus value={username} onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") setEditingName(false); if (e.key === "Escape") { setUsername(user?.username ?? ""); setEditingName(false); } }}
                    maxLength={50} className="flex-1 px-3 py-2 rounded-xl text-sm text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 outline-none transition-colors" />
                  <button onClick={() => setEditingName(false)} className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0 hover:bg-indigo-600 transition-colors">
                    <Check className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditingName(true)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700/70 border border-neutral-100 dark:border-neutral-700/50 transition-colors group">
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">{username}</span>
                  <Pencil className="w-3.5 h-3.5 text-neutral-400 group-hover:text-indigo-500 transition-colors" />
                </button>
              )}
            </div>

            {/* Quote */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">About</label>
              {editingQuote ? (
                <div className="space-y-1.5">
                  <textarea autoFocus value={quote} onChange={(e) => setQuote(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Escape") { setQuote((user as any)?.quote ?? ""); setEditingQuote(false); } }}
                    maxLength={139} rows={2} className="w-full px-3 py-2 rounded-xl text-sm text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 outline-none resize-none transition-colors" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-400">{139 - quote.length} chars left</span>
                    <button onClick={() => setEditingQuote(false)} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-colors">
                      <Check className="w-3 h-3" /> Done
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setEditingQuote(true)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700/70 border border-neutral-100 dark:border-neutral-700/50 transition-colors group text-left">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 italic line-clamp-2">{quote || "Add a quote…"}</span>
                  <Pencil className="w-3.5 h-3.5 text-neutral-400 group-hover:text-indigo-500 transition-colors shrink-0 ml-2" />
                </button>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Phone</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700/50">
                <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="text-sm text-neutral-500 dark:text-neutral-500 font-mono">{user?.phoneNo}</span>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 flex items-center gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={isSaving || !hasChanges} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save changes"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Cropper: Dialog band hai, sirf ye dikhta hai ── */}
      {showCropper && rawImageSrc && (
        <ImageCropper
          imageSrc={rawImageSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}