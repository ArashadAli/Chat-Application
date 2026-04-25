import app from "./app"
import http from "http"
import { Server } from "socket.io"
import dbConnection from "./config/db"
import registerSocketHandlers from "./sockets/socket"

const server = http.createServer(app)

const allowedOrigins = [
  "http://localhost:5173",
  "https://chat-application-virid-one.vercel.app",
  process.env.origin,         
].filter(Boolean) as string[]

export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
})

registerSocketHandlers(io)

dbConnection().then(() => {
  server.listen(process.env.PORT || 3000, () => {
    console.log(`server running at http://localhost:${process.env.PORT || 3000}`)
  })
})