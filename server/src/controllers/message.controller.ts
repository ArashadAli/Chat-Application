import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../types/authRequest.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversations.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { io } from "../server.js";

export const updateMsg = asyncHandler(async (req: AuthRequest, res: Response) => {
  const msgId = String(req.params.msgId);
  const userId = req.user?._id;

  if (!userId) throw new ApiError(401, "Unauthorized");
  if (!mongoose.Types.ObjectId.isValid(msgId)) throw new ApiError(400, "Invalid message id");

  const { content } = req.body;
  if (!content || !String(content).trim()) throw new ApiError(400, "Content is required");

  const message = await Message.findById(msgId);
  if (!message) throw new ApiError(404, "Message not found");
  if (message.senderId.toString() !== userId.toString()) throw new ApiError(403, "You can only edit your own messages");
  if (message.messageType !== "text") throw new ApiError(400, "Only text messages can be edited");
  if (!message.isActive) throw new ApiError(400, "Cannot edit a deleted message");

  message.content = String(content).trim();
  await message.save();

  const populated = await Message.findById(message._id)
    .populate("senderId", "username profilePic");

  const conversationId = message.conversationId.toString();

  const latestMessage = await Message.findOne({
    conversationId: message.conversationId,
    isActive: true,
  }).sort({ createdAt: -1 });

  if (latestMessage?._id.toString() === msgId) {
    await Conversation.findByIdAndUpdate(message.conversationId, {
      lastMessage: {
        text: message.content,
        senderId: message.senderId,
        timestamp: new Date(),
      },
    });
  }

  io.to(conversationId).emit("message_updated", {
    messageId: msgId,
    conversationId,
    content: message.content,
    updatedMessage: populated?.toObject(),
  });

  res.status(200).json({ success: true, message: populated });
});

export const deleteMsg = asyncHandler(async (req: AuthRequest, res: Response) => {
  const msgId = String(req.params.msgId);
  const userId = req.user?._id;

  if (!userId) throw new ApiError(401, "Unauthorized");
  if (!mongoose.Types.ObjectId.isValid(msgId)) throw new ApiError(400, "Invalid message id");

  const message = await Message.findById(msgId);
  if (!message) throw new ApiError(404, "Message not found");
  if (message.senderId.toString() !== userId.toString()) throw new ApiError(403, "You can only delete your own messages");
  if (!message.isActive) throw new ApiError(400, "Message already deleted");

  message.isActive = false;
  await message.save();

  const conversationId = message.conversationId.toString();

  const newLastMessage = await Message.findOne({
    conversationId: message.conversationId,
    isActive: true,
  }).sort({ createdAt: -1 });

  await Conversation.findByIdAndUpdate(message.conversationId, {
    lastMessage: newLastMessage
      ? {
          text: newLastMessage.content,
          senderId: newLastMessage.senderId,
          timestamp: newLastMessage.createdAt,
        }
      : null,
  });

  io.to(conversationId).emit("message_deleted", {
    messageId: msgId,
    conversationId,
    newLastMessage: newLastMessage
      ? {
          _id: newLastMessage._id.toString(),
          content: newLastMessage.content,
          senderId: newLastMessage.senderId.toString(),
          createdAt: newLastMessage.createdAt,
        }
      : null,
  });

  res.status(200).json({
    success: true,
    messageId: msgId,
    message: "Message deleted successfully",
  });
});