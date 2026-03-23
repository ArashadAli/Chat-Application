import { Response } from "express";
import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import Message from "../models/message.model";
import Conversation from "../models/conversations.model";
import { AuthRequest } from "../types/authRequest";

const sendConversationIdDetails = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { conversationId } = req.params as { conversationId: string };
    const user = req.user;

    if (!user) throw new ApiError(401, "Unauthorized user");

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new ApiError(400, "Invalid conversation id");
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new ApiError(404, "Conversation not found");

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: user._id },
        "status.userId": user._id,
      },
      { $set: { "status.$[elem].state": "read" } },
      { arrayFilters: [{ "elem.userId": user._id, "elem.state": { $ne: "read" } }] }
    );

    // ── CHANGE: isActive: true filter add kiya ──
    // Deleted messages (isActive: false) fetch nahi honge
    const messages = await Message.find({
      conversationId,
      isActive: true,        // ← yeh naya filter hai
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "username profilePic");

    res.status(200).json({
      success: true,
      message: "Conversation fetched successfully",
      messages,
    });
  }
);

export default sendConversationIdDetails;