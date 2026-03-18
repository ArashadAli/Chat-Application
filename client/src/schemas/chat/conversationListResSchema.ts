export interface ConversationParticipant {
  _id: string;
  username: string;
  profilePic: string;
  isOnline: boolean;
}

export interface ConversationLastMessage {
  _id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

export interface GroupMetadata {
  groupName: string;
  adminId: string;
  groupPic?: string;
}

export interface Conversation {
  _id: string;
  participants: ConversationParticipant[];
  isGroup: boolean;
  groupMetadata?: GroupMetadata;
  lastMessage?: ConversationLastMessage;
  unreadCount: number;
  updatedAt: string;
}

export type ConversationListResponse = Conversation[];

export const conversationListResSchema = {
  validate(data: unknown): ConversationListResponse {
    if (!Array.isArray(data)) throw new Error("Conversation list: expected an array");
    for (const item of data) {
      if (typeof item._id !== "string") throw new Error("Conversation: missing _id");
      if (!Array.isArray(item.participants)) throw new Error("Conversation: missing participants");
      if (typeof item.unreadCount !== "number") throw new Error("Conversation: missing unreadCount");
    }
    return data as ConversationListResponse;
  },
};