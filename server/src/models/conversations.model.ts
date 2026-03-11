import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  isGroup: boolean;
  groupMetadata?: {
    groupName: string;
    adminId: mongoose.Types.ObjectId;
    groupPic?: string;
  };
  lastMessage?: {
    text: string;
    senderId: mongoose.Types.ObjectId;
    timestamp: Date;
  };
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    isGroup: {
      type: Boolean,
      default: false
    },

    groupMetadata: {
      groupName: String,
      adminId: {
        type: Schema.Types.ObjectId,
        ref: "User"
      },
      groupPic: String
    },

    lastMessage: {
      text: String,
      senderId: {
        type: Schema.Types.ObjectId,
        ref: "User"
      },
      timestamp: Date
    }
  },
  { timestamps: true }
);

export default mongoose.model<IConversation>("Conversation", conversationSchema);