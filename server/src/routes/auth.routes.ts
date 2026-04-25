import express from "express";
import authControllers from "../controllers/authControllers";
import { signupSchema, loginSchema } from "../schemas/auth.schema";
import validateSchema from "../middleware/validateSchema"
import verifyJWT from "../middleware/authMiddleware";
import { AuthRequest } from "../types/authRequest";
import { Response } from "express";

const router = express.Router()

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account using phone number, username and password
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNo
 *               - username
 *               - password
 *             properties:
 *               phoneNo:
 *                 type: string
 *                 example: "1234567897"
 *               username:
 *                 type: string
 *                 example: "Gopal"
 *               password:
 *                 type: string
 *                 example: "mypassword123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "69b11b1d1a9fa87e982727e2"
 *                     phoneNo:
 *                       type: string
 *                       example: "1234567897"
 *                     username:
 *                       type: string
 *                       example: "Gopal"
 *                     password:
 *                       type: string
 *                       example: "$2b$10$hashedpassword"
 *                     isOnline:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       example: "2026-03-11T07:34:53.261Z"
 *                     updatedAt:
 *                       type: string
 *                       example: "2026-03-11T07:34:53.261Z"
 *                     __v:
 *                       type: number
 *                       example: 0
 *       400:
 *         description: Bad request
 */
router.post('/signup',validateSchema(signupSchema), authControllers.signup)


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user using phone number and password
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNo
 *               - password
 *             properties:
 *               phoneNo:
 *                 type: string
 *                 example: "1234567892"
 *               password:
 *                 type: string
 *                 example: "mypassword"
 *     responses:
 *       200:
 *         description: Successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Successfully logged in
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "69b110719c7ac0363a699595"
 *                     phoneNo:
 *                       type: string
 *                       example: "1234567892"
 *                     username:
 *                       type: string
 *                       example: "Arashad Ali"
 *                     isOnline:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       example: "2026-03-11T06:49:21.632Z"
 *                     updatedAt:
 *                       type: string
 *                       example: "2026-03-11T07:38:29.594Z"
 *                     __v:
 *                       type: number
 *                       example: 0
 *       401:
 *         description: Invalid Credentials
 */
router.post('/login',validateSchema(loginSchema), authControllers.login)

router.get('/me', verifyJWT, (req : AuthRequest, res : Response) => {
    const loggedInUser = req.user
    if(!loggedInUser){
        return res.json({success : false, message : "UnAuthorized User"})
    }

    return res
            .status(200)
            .json(
                {
                    success:true,
                    message : "Successfully data fetched",
                    loggedInUser
                }
            )
})

router.get('/logout', verifyJWT, authControllers.logout)

export default router