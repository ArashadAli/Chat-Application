import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";

import router from './routes/auth.routes'
import userRoute from './routes/user.routes';

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

app.use("/api/auth", router)
app.use("/user", userRoute)
// userRoute



//Global Error Handler Middleware

import errorHandler from './middleware/errorHandler'

app.use(errorHandler)


export default app