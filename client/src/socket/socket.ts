import { io } from "socket.io-client"

const serverRoot = import.meta.env.VITE_SOCKET_URL ?? 
  import.meta.env.VITE_BACKEND_BASE_URL?.replace("/api", "")

export const socket = io(serverRoot, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling"],
})