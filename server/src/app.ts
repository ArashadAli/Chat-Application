import dotenv from 'dotenv'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";

import authRouter from './routes/auth.routes'
import userRoute from './routes/conversation.routes';
import messageRoute from './routes/message.routes';
import profileRoute from './routes/profile.routes';
import path from 'path';


dotenv.config(
    {
        path:'.env'
    }
)

const app = express()

const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
    'https://chat-application-virid-one.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    credentials: true, // Cookies handle karne ke liye zaroori hai
    optionsSuccessStatus: 200 // Legacy browsers (IE11) ke liye
}));
app.use(express.json())
app.use(cookieParser())


app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
})


app.use("/uploads", express.static(path.resolve("./uploads")))

// swagger route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRouter)
app.use("/api/user", userRoute)
app.use("/api/user/message", messageRoute)
app.use("/api/user/profile", profileRoute)
// userRoute



//Global Error Handler Middleware

import errorHandler from './middleware/errorHandler'

app.use(errorHandler)


export default app