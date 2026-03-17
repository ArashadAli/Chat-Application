import app from "./app"
import http from "http"
import { Server } from "socket.io"
import dbConnection from "./config/db"
import registerSocketHandlers from "./sockets/socket"
import { logger } from "../src/utils/logger"

const server = http.createServer(app)


// console.log("check origin : ",process.env.origin)

const io = new Server(server, {
  cors: {
    origin: process.env.origin,
    credentials: true
  }
})

registerSocketHandlers(io)

dbConnection().then(() => {
//   logger.info("database connected and server started")
  server.listen(process.env.PORT || 3000, () => {
    console.log(`server running at http://localhost:${process.env.PORT}`)
  })
})