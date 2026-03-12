import express from 'express'
import verifyJWT from '../middleware/authMiddleware'
import getMessage from '../controllers/getMessageControllers'
import sendMessage from '../controllers/sendMessage'

const messageRoute = express.Router()


messageRoute.get("/:conversationId", verifyJWT, getMessage)

messageRoute.post("/sendMsg", verifyJWT, sendMessage)

export default messageRoute