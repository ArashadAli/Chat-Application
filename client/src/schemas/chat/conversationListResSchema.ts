

export interface ConversationParticipant {
  _id: string;
  username: string;
  profilePic: string;
  isOnline: boolean
}

export interface ConversationLastMessage {
  content: string;
  senderId: string;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: ConversationParticipant[];
  lastMessage?: ConversationLastMessage;
  unreadCount: number;
}

export type ConversationListResponse = Conversation[];

export const conversationListResponseSchema = {
  validate(data: unknown): ConversationListResponse {
    if (!Array.isArray(data)) {
      throw new Error("Conversation list: expected an array");
    }

    for (const item of data) {
      if (typeof item._id !== "string") {
        throw new Error("Conversation item: missing _id");
      }
      if (!Array.isArray(item.participants)) {
        throw new Error("Conversation item: missing participants array");
      }
      for (const p of item.participants) {
        if (typeof p._id !== "string" || typeof p.username !== "string") {
          throw new Error("Participant: missing _id or username");
        }
      }
      if (typeof item.unreadCount !== "number") {
        throw new Error("Conversation item: missing unreadCount");
      }
    }

    return data as ConversationListResponse;
  },
};