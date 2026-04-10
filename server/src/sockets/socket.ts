import { Server, Socket } from "socket.io"
import { chatSocket } from "./socket.chats.js"
import {disconnectSocket} from "./socket.chats.js"
import { logger } from "../utils/logger.js"
export default function registerSocketHandlers(io: Server) {

  io.on("connection", (socket: Socket) => {

    // logger.info("connected userId : ", socket.id)

    chatSocket(io, socket)
    
    socket.on("disconnect", () => {
      // logger.info("disConnected userId : ", socket.id)
      disconnectSocket(socket)
    })

  })
}