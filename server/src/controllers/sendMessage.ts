import { Response } from "express"
import { AuthRequest } from "../types/authRequest.js"
import Message from "../models/message.model.js"
import Conversation from "../models/conversations.model.js"

const sendMessage = async (req : AuthRequest , res : Response)=>{

 const senderId = req.user?._id
 const { conversationId, content } = req.body

 const message = await Message.create({
  conversationId,
  senderId,
  content,
  status:[
   { userId: senderId, state:"sent" }
  ]
 })

//  console.log("mul msg : ", message)

 await Conversation.findByIdAndUpdate(
  conversationId,
  {
   lastMessage:{
    text:content,
    senderId,
    timestamp:new Date()
   }
  }
 )

 res.json(message)

}

export default sendMessage