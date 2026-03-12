import { Response } from "express"
import { AuthRequest } from "../types/authRequest"
import Conversation from "../models/conversations.model"
import ChatRequest from "../models/chatRequest.model"

const createGroupConversation = async (req: AuthRequest, res: Response) => {

  const adminId = req.user?._id
  const { groupName, participants } = req.body

  if (!participants || participants.length < 2) {
    return res.status(400).json({
      message: "Group must have at least 3 members including admin"
    })
  }

  // check accepted requests
  const acceptedUsers = []

  for (const userId of participants) {

    const request = await ChatRequest.findOne({
      $or: [
        { senderId: adminId, receiverId: userId, status: "accepted" },
        { senderId: userId, receiverId: adminId, status: "accepted" }
      ]
    })

    if (request) {
      acceptedUsers.push(userId)
    }
  }

  // remove duplicates and add admin
  const uniqueParticipants = [...new Set([adminId?.toString(), ...acceptedUsers])]

  if (uniqueParticipants.length < 3) {
    return res.status(400).json({
      message: "Group must contain at least 3 accepted participants"
    })
  }

  const group = await Conversation.create({
    participants: uniqueParticipants,
    isGroup: true,
    groupMetadata: {
      groupName,
      adminId
    }
  })

  res.status(201).json(group)
}

export default createGroupConversation