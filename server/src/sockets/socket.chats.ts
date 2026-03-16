import { Server, Socket } from "socket.io"
import Message from "../models/message.model"
import Conversation from "../models/conversations.model"
import User from "../models/user.model"


const onlineUsers = new Map<string, string>()
const socketToUser = new Map<string, string>()


export function chatSocket(io: Server, socket: Socket) {

  // user connected
  socket.on("user_connected", async (userId: string) => {

    onlineUsers.set(userId, socket.id)
    socketToUser.set(socket.id, userId)

    await User.findByIdAndUpdate(userId, { isOnline: true })

    // console.log("connectedUser : ", connectedUser)

    // console.log("online users:", onlineUsers)
  })


  // join conversation room
  socket.on("join_conversation", async (conversationId: string) => {

    socket.join(conversationId)

    const userId = socketToUser.get(socket.id)

    if (!userId) return

    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        "status.userId": userId
      },
      {
        $set: {
          "status.$[elem].state": "delivered"
        }
      },
      {
        arrayFilters: [
          { "elem.userId": userId, "elem.state": "sent" }
        ]
      }
    )

  })


  // send message
  socket.on("send_message", async (data) => {

    const { conversationId, senderId, message } = data

    const newMessage = await Message.create({
      conversationId,
      senderId,
      content: message,
      status: [
        { userId: senderId, state: "sent" }
      ]
    })

    // console.log("msg from socket : ", newMessage)

    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: {
          text: message,
          senderId,
          timestamp: new Date()
        }
      }
    )

    io.to(conversationId).emit("receive_message", newMessage)

  })

}

export async function disconnectSocket(socket: Socket) {

  const userId = socketToUser.get(socket.id)
  if (!userId) return

  await User.findByIdAndUpdate(userId, { isOnline: false })
  onlineUsers.delete(userId)
  socketToUser.delete(socket.id)

}
