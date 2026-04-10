import { Response } from "express"
import { AuthRequest } from "../types/authRequest.js"
import ChatRequest from "../models/chatRequest.model.js"

import User from "../models/user.model.js"

const sendChatRequest = async (req: AuthRequest, res: Response) => {

  const senderId = req.user?._id
  const { phoneNo } = req.body

  // console.log("phoneNo from frontend : ", phoneNo)

  const receiver = await User.findOne({ phoneNo })

  console.log("receiver data : ", receiver)

  if (!receiver) {
    return res.status(404).json({ message: "User not found" })
  }

  const receiverId = receiver._id

  if (senderId?.toString() === receiverId.toString()) {
    return res.status(400).json({ message: "Cannot send request to yourself" })
  }

  const existingRequest = await ChatRequest.findOne({
    $or: [
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId }
    ]
  })

  if (existingRequest) {
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