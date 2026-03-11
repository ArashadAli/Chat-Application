import app from './app'
import http from 'http'
import { Server } from 'socket.io'
import dbConnection from './config/db'

const server = http.createServer(app)

const io = new Server(server)

dbConnection()
.then(() => {
    server.listen(process.env.PORT || 3000, () => {
    
    console.log(`server is running at : http://localhost:${process.env.PORT}`)
})
})