

import { create } from "zustand";

export interface Conversation {
  _id: string;
  participants: {
    _id: string;
    username: string;
    phoneNo: string;
  }[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
}

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversation: null,
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (conversation) =>
    set({ activeConversation: conversation }),
}));