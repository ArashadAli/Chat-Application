import { X, Phone, Users, Info, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "../../store/authStore";
import type { Conversation } from "../../schemas/chat/conversationListResSchema";

interface Props {
  conversation: Conversation;
  allConversations: Conversation[];
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-600 px-4">
        {title}
      </p>
      {children}
    </div>
  );
}

export default function ContactInfoPanel({ conversation, allConversations, isOpen, onClose }: Props) {
  const myId = useAuthStore((s) => s.user?._id ?? "");
  const isGroup = conversation.isGroup;

  const other = !isGroup
    ? (conversation.participants.find((p) => p._id !== myId) ?? conversation.participants[0])
    : null;

  const name = isGroup
    ? (conversation.groupMetadata?.groupName ?? "Group")
    : (other?.username ?? "");

  const [c1, c2] = getColors(name);
  const initials = name.slice(0, 2).toUpperCase();
  const pic = isGroup ? conversation.groupMetadata?.groupPic : other?.profilePic;

  // Common groups — groups where both myId and other._id are participants
  const commonGroups = !isGroup && other
    ? allConversations.filter(
        (c) =>
          c.isGroup &&
          c.participants.some((p) => p._id === myId) &&
          c.participants.some((p) => p._id === other._id)
      )
    : [];

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full w-72 xl:w-80 shrink-0 bg-white dark:bg-neutral-900 border-l border-neutral-100 dark:border-neutral-800">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            {isGroup ? "Group Info" : "Contact Info"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-5 space-y-5">

          {/* Hero avatar + name */}
          <div className="flex flex-col items-center gap-3 px-4">
            <div className="relative">
              <Avatar className="w-24 h-24 rounded-3xl shadow-lg">
                <AvatarImage src={pic} alt={name} className="rounded-3xl object-cover" />
                <AvatarFallback
                  className="rounded-3xl text-white text-2xl font-bold"
                  style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Online dot — DM only */}
              {!isGroup && (
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900 ${other?.isOnline ? "bg-emerald-400" : "bg-neutral-300 dark:bg-neutral-600"}`} />
              )}
            </div>

            <div className="text-center">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">
                {name}
              </h2>
              {!isGroup && (
                <p className={`text-xs font-medium mt-0.5 ${other?.isOnline ? "text-emerald-500" : "text-neutral-400 dark:text-neutral-500"}`}>
                  {other?.isOnline ? "Online" : "Offline"}
                </p>
              )}
              {isGroup && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                  {conversation.participants.length} members
                </p>
              )}
            </div>
          </div>

          {/* Quote / About — DM only */}
          {!isGroup && (
            <Section title="About">
              <div className="mx-4 px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700/50">
                <p className="text-sm text-neutral-600 dark:text-neutral-300 italic leading-relaxed">
                  {(other as any)?.quote || "Hey there! I am using ChatMet."}
                </p>
              </div>
            </Section>
          )}

          {/* Phone — DM only */}
          {!isGroup && (
            <Section title="Phone">
              <div className="mx-4 flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700/50">
                <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="text-sm font-mono text-neutral-700 dark:text-neutral-300">
                  {(other as any)?.phoneNo ?? "—"}
                </span>
              </div>
            </Section>
          )}

          {/* Group members */}
          {isGroup && (
            <Section title={`Members · ${conversation.participants.length}`}>
              <div className="mx-4 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-700/50 divide-y divide-neutral-100 dark:divide-neutral-700/50">
                {conversation.participants.map((p) => {
                  const [pc1, pc2] = getColors(p.username);
                  const isMe = p._id === myId;
                  const isAdmin = conversation.groupMetadata?.adminId === p._id;
                  return (
                    <div key={p._id} className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-neutral-800/60">
                      <div className="relative shrink-0">
                        <Avatar className="w-8 h-8 rounded-xl">
                          <AvatarImage src={p.profilePic} alt={p.username} className="rounded-xl object-cover" />
                          <AvatarFallback className="rounded-xl text-white text-[10px] font-bold"
                            style={{ background: `linear-gradient(135deg, ${pc1}, ${pc2})` }}>
                            {p.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-neutral-800 ${p.isOnline ? "bg-emerald-400" : "bg-neutral-300 dark:bg-neutral-600"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                          {p.username} {isMe && <span className="text-neutral-400">(you)</span>}
                        </p>
                        {isAdmin && (
                          <p className="text-[10px] text-indigo-500 font-medium leading-none mt-0.5">Admin</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Common groups — DM only */}
          {!isGroup && commonGroups.length > 0 && (
            <Section title={`${commonGroups.length} Group${commonGroups.length > 1 ? "s" : ""} in Common`}>
              <div className="mx-4 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-700/50 divide-y divide-neutral-100 dark:divide-neutral-700/50">
                {commonGroups.map((g) => {
                  const gName = g.groupMetadata?.groupName ?? "Group";
                  const [gc1, gc2] = getColors(gName);
                  return (
                    <div key={g._id} className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-neutral-800/60">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `linear-gradient(135deg, ${gc1}, ${gc2})` }}>
                        <Users className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">{gName}</p>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-none mt-0.5">
                          {g.participants.length} members
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* No common groups message */}
          {!isGroup && commonGroups.length === 0 && (
            <Section title="Groups in Common">
              <div className="mx-4 flex flex-col items-center gap-2 py-4 px-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700/50">
                <MessageCircle className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />
                <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center">No groups in common</p>
              </div>
            </Section>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}