import { Response } from "express"
import { AuthRequest } from "../types/authRequest"
import ChatRequest from "../models/chatRequest.model"

 const sendChatRequest = async (req : AuthRequest, res : Response) => {

  const senderId = req.user?._id
  const { receiverId } = req.body

  if(senderId?.toString() === receiverId){
    return res.status(400).json({message:"Cannot send request to yourself"})
  }

  const existing = await ChatRequest.findOne({
    senderId,
    receiverId
  })

  if(existing){
    return res.status(400).json({
      message:"Request already sent"
    })
  }

  const request = await ChatRequest.create({
    senderId,
    receiverId
  })

  res.status(201).json(request)
}

export default sendChatRequest