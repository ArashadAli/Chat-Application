import { Response } from "express"
import { AuthRequest } from "../types/authRequest"

import Conversation from "../models/conversations.model"

const createIndividualConversation = async (req : AuthRequest, res : Response) => {

  const senderId = req.user?._id
  const { receiverId } = req.body

  if (senderId?.toString() === receiverId) {
    return res.status(400).json({
      message: "Cannot create conversation with yourself"
    })
  }

  // check existing conversation
  const existingConversation = await Conversation.findOne({
    isGroup: false,
    participants: { $all: [senderId, receiverId] }
  })

  if (existingConversation) {
    return res.json(existingConversation)
  }

  const conversation = await Conversation.create({
    participants: [senderId, receiverId],
    isGroup: false
  })

  res.status(201).json(conversation)
}

export default createIndividualConversation