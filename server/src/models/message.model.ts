import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  isActive:boolean,
  messageType: "text" | "file" | "image";
  fileMetadata?: {
    originalName: string;
    fileName: string;
    mimeType: string;
    size: number;
    url: string;
  };
  status: {
    userId: mongoose.Types.ObjectId;
    state: "sent" | "delivered" | "read";
  }[];
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "file", "image"],
      default: "text",
    },
    isActive: {
      type: Boolean,
      default: true
    },
    fileMetadata: {
      originalName: String,
      fileName: String,
      mimeType: String,
      size: Number,
      url: String,
    },
    status: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        state: {
          type: String,
          enum: ["sent", "delivered", "read"],
          default: "sent",
        },
      },
    ],
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model<IMessage>("Message", messageSchema);