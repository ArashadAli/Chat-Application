import { useState } from "react";
import { Bell, Inbox } from "lucide-react";
import type { ChatRequest } from "../../workers/chat/getChatRequest";
import ChatRequestItem from "./ChatRequestItem";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
 
interface Props {
  isOpen: boolean;
  onClose: () => void;
  requests: ChatRequest[];
  isLoading: boolean;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}
 
export default function ChatRequestModal({
  isOpen,
  onClose,
  requests,
  isLoading,
  onAccept,
  onReject,
}: Props) {
  // Track which requestId is currently being accepted (shows spinner on that item only)
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
 
  async function handleAccept(requestId: string) {
    setAcceptingId(requestId);
    try {
      await onAccept(requestId);
    } finally {
      setAcceptingId(null);
    }
  }
 
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-sm sm:max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl p-0 gap-0">
 
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-bold text-neutral-900 dark:text-white leading-tight">
                Chat Requests
              </DialogTitle>
              {!isLoading && (
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-none mt-0.5">
                  {requests.length === 0
                    ? "No pending requests"
                    : `${requests.length} pending ${requests.length === 1 ? "request" : "requests"}`}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>
 
        {/* Body */}
        <div className="px-4 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <svg className="w-5 h-5 animate-spin text-sky-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 select-none">
              <Inbox className="w-8 h-8 text-neutral-300 dark:text-neutral-700" />
              <p className="text-sm text-neutral-400 dark:text-neutral-600 font-medium">
                No pending requests
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-72">
              <div className="space-y-2 pr-1">
                {requests.map((req) => (
                  <ChatRequestItem
                    key={req._id}
                    request={req}
                    onAccept={handleAccept}
                    onReject={onReject}
                    isAccepting={acceptingId === req._id}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}