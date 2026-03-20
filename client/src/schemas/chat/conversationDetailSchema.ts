export type MessageState = "sent" | "delivered" | "read";
export type MessageType = "text" | "file" | "image";

export interface MessageStatus {
  userId: string;
  state: MessageState;
}

export interface MessageSender {
  _id: string;
  username: string;
  profilePic: string;
}

export interface FileMetadata {
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: MessageSender;
  content: string;
  messageType: MessageType;
  fileMetadata?: FileMetadata;
  status: MessageStatus[];
  createdAt: string;
}

export interface ConversationDetailsResponse {
  success: boolean;
  message: string;
  messages: Message[];
}

export const conversationDetailsResSchema = {
  validate(data: unknown): ConversationDetailsResponse {
    if (typeof data !== "object" || data === null)
      throw new Error("Conversation details: expected an object");
    const d = data as any;
    if (typeof d.success !== "boolean") throw new Error("Missing 'success'");
    if (!Array.isArray(d.messages)) throw new Error("Missing 'messages' array");
    for (const msg of d.messages) {
      if (typeof msg._id !== "string") throw new Error("Message: missing _id");
      if (typeof msg.senderId !== "object" || msg.senderId === null)
        throw new Error("Message: senderId must be populated object");
      if (typeof msg.content !== "string") throw new Error("Message: missing content");
      if (!Array.isArray(msg.status)) throw new Error("Message: missing status array");
    }
    return data as ConversationDetailsResponse;
  },
};