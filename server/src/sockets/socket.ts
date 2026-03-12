import { Server, Socket } from "socket.io"
import { chatSocket } from "./socket.chats"
import {disconnectSocket} from "./socket.chats"

export default function registerSocketHandlers(io: Server) {

  io.on("connection", (socket: Socket) => {

    console.log("Connected user socketId :", socket.id)

    chatSocket(io, socket)

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id)
      disconnectSocket(socket)
    })

  })
}