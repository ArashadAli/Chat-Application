import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";

import authRouter from './routes/auth.routes'
import userRoute from './routes/conversation.routes';
import messageRoute from './routes/message.routes';

dotenv.config(
    {
        path:'.env'
    }
)

const app = express()

app.use(cors(
    {
        origin:'http://localhost:5173/',
    }
));
app.use(express.json())

// swagger route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRouter)
app.use("/api/user", userRoute)
app.use("/api/user/message", messageRoute)

// userRoute



//Global Error Handler Middleware

import errorHandler from './middleware/errorHandler'

app.use(errorHandler)


export default app