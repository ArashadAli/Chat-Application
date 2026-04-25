import { Server, Socket } from "socket.io"
import Message from "../models/message.model"
import Conversation from "../models/conversations.model"
import User from "../models/user.model"

const onlineUsers = new Map<string, string>()
const socketToUser = new Map<string, string>()

export function chatSocket(io: Server, socket: Socket) {

  socket.on("user_connected", async (userId: string) => {
    onlineUsers.set(userId, socket.id)
    socketToUser.set(socket.id, userId)
    await User.findByIdAndUpdate(userId, { isOnline: true })
    socket.broadcast.emit("user_status_changed", { userId, isOnline: true })
  })

  socket.on("join_conversation", async (conversationId: string) => {
    socket.join(conversationId)
    const userId = socketToUser.get(socket.id)
    if (!userId) return
    await Message.updateMany(
      { conversationId, senderId: { $ne: userId }, "status.userId": userId },
      { $set: { "status.$[elem].state": "delivered" } },
      { arrayFilters: [{ "elem.userId": userId, "elem.state": "sent" }] }
    )
  })

  socket.on("send_message", async (data) => {

    // console.log("send_msg data : ", data)
    const { conversationId, senderId, message } = data

    const conversation = await Conversation.findById(conversationId).select("participants")
    if (!conversation) return

    const statusArray = conversation.participants.map((participantId: any) => {
      const uid = participantId.toString()
      if (uid === senderId) return { userId: uid, state: "sent" }
      const recipientSocketId = onlineUsers.get(uid)
      const isInRoom = recipientSocketId
        ? io.sockets.adapter.rooms.get(conversationId)?.has(recipientSocketId)
        : false
      return { userId: uid, state: isInRoom ? "delivered" : "sent" }
    })

    const newMessage = await Message.create({
      conversationId,
      senderId,
      content: message,
      messageType: "text",
      status: statusArray,
    })

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: { text: message, senderId, timestamp: new Date() },
    })

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "username profilePic")

    // FIX: toObject() + conversationId.toString() — frontend string match ke liye
    const emitPayload = {
      ...populatedMessage?.toObject(),
      conversationId: conversationId.toString(),
    }

    io.to(conversationId).emit("receive_message", emitPayload)

    const roomMembers = io.sockets.adapter.rooms.get(conversationId) ?? new Set()
    conversation.participants.forEach((participantId: any) => {
      const uid = participantId.toString()
      if (uid === senderId) return
      const recipientSocketId = onlineUsers.get(uid)
      if (!recipientSocketId) return
      if (roomMembers.has(recipientSocketId)) return
      io.to(recipientSocketId).emit("receive_message", emitPayload)
    })

    const senderSocketId = onlineUsers.get(senderId)
    if (senderSocketId) {
      io.to(senderSocketId).emit("message_status_update", {
        messageId: newMessage._id.toString(),
        conversationId: conversationId.toString(),
        statuses: newMessage.status,
      })
    }
  })

  socket.on("send_file_message", async (data: { conversationId: string; messageId: string }) => {
    const { conversationId, messageId } = data
    const senderId = socketToUser.get(socket.id)
    if (!senderId) return

    const conversation = await Conversation.findById(conversationId).select("participants")
    if (!conversation) return

    const populatedMessage = await Message.findById(messageId)
      .populate("senderId", "username profilePic")
    if (!populatedMessage) return

    const emitPayload = {
      ...populatedMessage.toObject(),
      conversationId: conversationId.toString(),
    }

    io.to(conversationId).emit("receive_message", emitPayload)

    const roomMembers = io.sockets.adapter.rooms.get(conversationId) ?? new Set()
    conversation.participants.forEach((participantId: any) => {
      const uid = participantId.toString()
      if (uid === senderId) return
      const recipientSocketId = onlineUsers.get(uid)
      if (!recipientSocketId) return
      if (roomMembers.has(recipientSocketId)) return
      io.to(recipientSocketId).emit("receive_message", emitPayload)
    })
  })

  socket.on("notify_chat_request", (recipientId: string) => {
    const recipientSocketId = onlineUsers.get(recipientId)
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("new_chat_request")
    }
  })

  socket.on("accept_chat_request", (data: { conversationId: string; otherUserId: string }) => {
    const otherSocketId = onlineUsers.get(data.otherUserId)
    if (otherSocketId) {
      io.to(otherSocketId).emit("conversation_created", { conversationId: data.conversationId })
    }
  })

  socket.on("notify_group_created", (data: { conversationId: string; participantId: string }) => {
    const participantSocketId = onlineUsers.get(data.participantId)
    if (participantSocketId) {
      io.to(participantSocketId).emit("group_created", { conversationId: data.conversationId })
    }
  })
}

export async function disconnectSocket(socket: Socket) {
  const userId = socketToUser.get(socket.id)
  if (!userId) return
  await User.findByIdAndUpdate(userId, { isOnline: false })
  onlineUsers.delete(userId)
  socketToUser.delete(socket.id)
  socket.broadcast.emit("user_status_changed", { userId, isOnline: false })
}