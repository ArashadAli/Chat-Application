import { Response } from "express"
import { AuthRequest } from "../types/authRequest"
import ChatRequest from "../models/chatRequest.model"

import User from "../models/user.model"

const sendChatRequest = async (req: AuthRequest, res: Response) => {

  const senderId = req.user?._id
  const { phoneNo } = req.body

  // console.log("phoneNo from frontend : ", phoneNo)

  const receiver = await User.findOne({ phoneNo })

  if (!receiver) {
    return res.status(404).json({ message: "User not found" })
  }

  const receiverId = receiver._id

  if (senderId?.toString() === receiverId.toString()) {
    return res.status(400).json({ message: "Cannot send request to yourself" })
  }

  const existing = await ChatRequest.findOne({
    senderId,
    receiverId
  })

  if (existing) {
    return res.status(400).json({
      message: "Request already sent"
    })
  }

  const request = await ChatRequest.create({
    senderId,
    receiverId
  })

  res.status(201).json(request)
}

export default sendChatRequest