import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import router from './routes/user.routes'

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



app.use("/api/auth", router)


export default app