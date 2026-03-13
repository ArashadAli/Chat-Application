import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";

function getOtherParticipant(conversation: any, myId: string) {
  return (
    conversation.participants.find((p: any) => p._id !== myId) ??
    conversation.participants[0]
  );
}

export default function ChatArea() {
  const activeConversation = useChatStore((s) => s.activeConversation);
  const myId = useAuthStore((s) => s.user?._id ?? "");

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 select-none">
        {/* Decorative ring */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center">
            <svg className="w-9 h-9 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
        </div>

        <h2 className="text-base font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
          Select a conversation
        </h2>
        <p className="text-sm text-neutral-400 dark:text-neutral-600 text-center max-w-xs">
          Choose someone from the sidebar to start chatting.
        </p>
      </div>
    );
  }

  const other = getOtherParticipant(activeConversation, myId);

  return (
    <div className="flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-950 min-h-0">

      {/* Chat header */}
      <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-teal-400 flex items-center justify-center">
          <span className="text-xs font-bold text-white">
            {other.username.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
            {other.username}
          </p>
          <p className="text-xs text-emerald-500">Online</p>
        </div>
      </div>

      {/* Messages area (placeholder) */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col items-center justify-center gap-3">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Start your conversation with{" "}
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              {other.username}
            </span>
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-600">
            Messages will appear here.
          </p>
        </div>
      </div>

      {/* Message input (placeholder) */}
      <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={`Message ${other.username}…`}
           
            className="
              flex-1 px-4 py-2.5 rounded-xl text-sm
              bg-neutral-100 dark:bg-neutral-800
              border border-transparent
              text-neutral-400 dark:text-neutral-500
              placeholder:text-neutral-400 dark:placeholder:text-neutral-600
              cursor-not-allowed
            "
          />
          <button
            
            className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-400 cursor-not-allowed opacity-60"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}