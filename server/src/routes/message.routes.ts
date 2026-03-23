import express from 'express'
import verifyJWT from '../middleware/authMiddleware'
import getMessage from '../controllers/getMessageControllers'
import sendMessage from '../controllers/sendMessage'
import { updateMsg, deleteMsg } from '../controllers/message.controller'

const messageRoute = express.Router()


messageRoute.get("/:conversationId", verifyJWT, getMessage)

messageRoute.post("/sendMsg", verifyJWT, sendMessage)
messageRoute.patch("/updateMsg/:msgId", verifyJWT, updateMsg)
messageRoute.post("/delete/:msgId", verifyJWT, deleteMsg)

export default messageRoute