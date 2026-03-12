import express from 'express'
import verifyJWT from '../middleware/authMiddleware'
import sendUserConversation from '../controllers/sendUserConveersation'
import sendUser from '../controllers/sendUser'
import sendChatRequest from '../controllers/chatRequest.controllers'
import getPendingRequest from '../controllers/getPendingRequest.controllers'
import acceptChatRequest from '../controllers/acceptChatRequest'
import createIndividualConversation from '../controllers/chatIndividualy'
import createGroupConversation from '../controllers/groupConversation'

const userRoute = express.Router()

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get logged-in user profile
 *     description: Fetch the profile details of the authenticated user
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: user profile fetched
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "69b110719c7ac0363a699595"
 *                     phoneNo:
 *                       type: string
 *                       example: "1234567892"
 *                     username:
 *                       type: string
 *                       example: "Arashad Ali"
 *                     isOnline:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       example: "2026-03-11T06:49:21.632Z"
 *                     updatedAt:
 *                       type: string
 *                       example: "2026-03-11T10:45:36.085Z"
 *                     __v:
 *                       type: number
 *                       example: 0
 *       401:
 *         description: Unauthorized user
 */
userRoute.get("/conversation", verifyJWT, sendUserConversation)
userRoute.post("/conversation/individual", verifyJWT, createIndividualConversation)
userRoute.post("/conversation/group", verifyJWT, createGroupConversation)

userRoute.get("/:searchId", verifyJWT, sendUser)

userRoute.post("/chat-request", verifyJWT, sendChatRequest)
userRoute.get("/chat-request", verifyJWT, getPendingRequest)

userRoute.post("/chat-request/accept", verifyJWT, acceptChatRequest)


export default userRoute