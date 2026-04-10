import express from 'express'
import verifyJWT from '../middleware/authMiddleware.js'
import getMessage from '../controllers/getMessageControllers.js'
import sendMessage from '../controllers/sendMessage.js'
import { updateMsg, deleteMsg } from '../controllers/message.controller.js'

const messageRoute = express.Router()


messageRoute.get("/:conversationId", verifyJWT, getMessage)

messageRoute.post("/sendMsg", verifyJWT, sendMessage)
messageRoute.patch("/updateMsg/:msgId", verifyJWT, updateMsg)
messageRoute.post("/delete/:msgId", verifyJWT, deleteMsg)

export default messageRoute