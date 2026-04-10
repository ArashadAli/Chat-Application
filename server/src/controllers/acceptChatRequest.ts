import { Request, Response } from "express"

import Conversation from "../models/conversations.model.js"
import ChatRequest from "../models/chatRequest.model.js"

const acceptChatRequest = async (req : Request, res : Response)=>{

 const { requestId } = req.body

 const request = await ChatRequest.findById(requestId)

 if(!request){
  return res.status(404).json({message:"Request not found"})
 }

 request.status = "accepted"
 await request.save()

 const conversation = await Conversation.create({
  participants:[request.senderId, request.receiverId]
 })

 res.json({
  message:"Conversation created",
  conversation
 })

}

export default acceptChatRequest