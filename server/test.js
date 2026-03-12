const socket = require("socket.io-client")("http://localhost:8000")

socket.on("connect", () => {

  socket.emit("user_connected","69b110719c7ac0363a699595")

  socket.emit("join_conversation", "69b271b6b466cc024a7dc203")

  socket.emit("send_message", {
    conversationId: "69b271b6b466cc024a7dc203",
    senderId: "69b110719c7ac0363a699595",
    message: "checking for connected and disconnected"
  })
})