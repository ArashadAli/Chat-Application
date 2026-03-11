import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
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
      required: true
    },

    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    content: {
      type: String,
      required: true
    },

    status: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User"
        },
        state: {
          type: String,
          enum: ["sent", "delivered", "read"],
          default: "sent"
        }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>("Message", messageSchema);