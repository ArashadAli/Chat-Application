import { AuthRequest } from "../types/authRequest";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import { Response } from "express";
import Conversation from "../models/conversations.model"
const sendUserConversation = asyncHandler(async (req: AuthRequest, res: Response) => {

  const userId = req.user?._id

  if(!userId) new ApiError(401, "userId Not Found")

  const conversations = await Conversation.find({
    participants: userId
  })
  .populate("participants", "username profilePic")
  .sort({ updatedAt: -1 })

  res.json(conversations)

});

export default sendUserConversation