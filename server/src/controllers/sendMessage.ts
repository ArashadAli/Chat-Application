import { Response } from "express"
import { AuthRequest } from "../types/authRequest"
import Message from "../models/message.model"
import Conversation from "../models/conversations.model"

const sendMessage = async (req : AuthRequest , res : Response)=>{

// console.log("req url : ", req.url)

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