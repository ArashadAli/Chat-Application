import { Users, Check, X } from "lucide-react";
import type { Conversation } from "../../schemas/chat/conversationListResSchema";
import { useAuthStore } from "../../store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  groupName: string;
  onGroupNameChange: (val: string) => void;
  selectedIds: string[];
  onToggle: (userId: string) => void;
  onSubmit: () => void;
  isCreating: boolean;
}

function avatarGradient(name: string) {
  const palette = [
    "from-rose-400 to-pink-500",
    "from-orange-400 to-amber-500",
    "from-emerald-400 to-teal-500",
    "from-sky-400 to-blue-500",
    "from-violet-400 to-purple-500",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return palette[h % palette.length];
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  conversations,
  groupName,
  onGroupNameChange,
  selectedIds,
  onToggle,
  onSubmit,
  isCreating,
}: Props) {
  const myId = useAuthStore((s) => s.user?._id ?? "");

  // Build unique participant list from existing conversations (exclude self)
  const seen = new Set<string>();
  const contacts = conversations.flatMap((c) =>
    c.participants.filter((p) => {
      if (p._id === myId || seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    })
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-sm sm:max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl p-0 gap-0">

        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/20">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-bold text-neutral-900 dark:text-white leading-tight">
                Create Group
              </DialogTitle>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-none mt-0.5">
                {selectedIds.length === 0
                  ? "Select at least 2 members"
                  : `${selectedIds.length} selected`}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-4 py-3 flex flex-col gap-3">

          {/* Group name input */}
          <Input
            type="text"
            placeholder="Group name…"
            value={groupName}
            onChange={(e) => onGroupNameChange(e.target.value)}
            className="h-9 rounded-xl text-sm bg-neutral-100 dark:bg-neutral-800 border-transparent focus-visible:ring-1 focus-visible:ring-violet-400/40 placeholder:text-neutral-400"
          />

          {/* Selected chips */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedIds.map((id) => {
                const contact = contacts.find((c) => c._id === id);
                if (!contact) return null;
                return (
                  <span
                    key={id}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[11px] font-medium"
                  >
                    {contact.username}
                    <button onClick={() => onToggle(id)} className="hover:text-rose-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Contact list */}
          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-28 gap-2">
              <Users className="w-7 h-7 text-neutral-300 dark:text-neutral-700" />
              <p className="text-xs text-neutral-400 dark:text-neutral-600">No contacts available</p>
            </div>
          ) : (
            <ScrollArea className="max-h-56">
              <div className="space-y-1 pr-1">
                {contacts.map((contact) => {
                  const isSelected = selectedIds.includes(contact._id);
                  return (
                    <button
                      key={contact._id}
                      onClick={() => onToggle(contact._id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                        transition-all duration-150 border
                        ${isSelected
                          ? "bg-violet-50 dark:bg-violet-950/40 border-violet-200/70 dark:border-violet-800/50"
                          : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-transparent"
                        }
                      `}
                    >
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={contact.profilePic} alt={contact.username} />
                        <AvatarFallback className={`bg-gradient-to-br ${avatarGradient(contact.username)} text-white text-[10px] font-bold`}>
                          {contact.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <span className="flex-1 text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {contact.username}
                      </span>

                      {/* Checkbox indicator */}
                      <span className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                        ${isSelected
                          ? "bg-violet-500 border-violet-500"
                          : "border-neutral-300 dark:border-neutral-600"
                        }
                      `}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <Button
            onClick={onSubmit}
            disabled={isCreating || selectedIds.length < 2 || !groupName.trim()}
            className="w-full h-9 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Create Group
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}