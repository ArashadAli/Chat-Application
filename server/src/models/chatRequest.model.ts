import mongoose, { Schema, Document } from "mongoose";

export interface IChatRequest extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
}

const chatRequestSchema = new Schema<IChatRequest>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model<IChatRequest>("ChatRequest", chatRequestSchema);