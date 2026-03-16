import { AuthRequest } from "../types/authRequest";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import { Response } from "express";
import Conversation from "../models/conversations.model"
import Message from "../models/message.model";


const sendUserConversation = asyncHandler(async (req: AuthRequest, res: Response) => {

  const userId = req.user?._id

  if(!userId) throw new ApiError(401, "userId Not Found")

  const conversations = await Conversation.find({
    participants: userId
  })
  .populate("participants", "username profilePic isOnline")
  .sort({ updatedAt: -1 })

  const formattedConversations = await Promise.all(
    conversations.map(async (conv) => {

      const lastMessage = await Message.findOne({
        conversationId: conv._id
      }).sort({ createdAt: -1 })

      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        senderId: { $ne: userId },
        status: {
          $elemMatch: {
            userId,
            state: { $ne: "read" }
          }
        }
      })

      return {
        ...conv.toObject(),
        lastMessage,
        unreadCount
      }
    })
  )

  res.json(formattedConversations)
})

export default sendUserConversation