import { Request, Response } from "express"
import { CookieOptions } from "express"
import bcrypt from "bcrypt"
import userModel from "../models/user.model"
import { generateTokens } from "../utils/generateToken"

const signup = async (req: Request, res: Response): Promise<void> => {
    try {

        const { phoneNo, username, password } = req.body

        if (!phoneNo || !username || !password) {
            res.status(400).json({
                success: false,
                message: "All fields are required"
            })
            return
        }

        const existingUser = await userModel.findOne({ phoneNo })

        if (existingUser) {
            res.status(409).json({
                success: false,
                message: "User already exists"
            })
            return
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await userModel.create({
            phoneNo,
            username,
            password: hashedPassword
        })

        res.status(201).json({
            success: true,
            message: "User registered successfully",
        })

    } catch (error) {
        console.log("Signup error:", error)

        res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}

const login = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { phoneNo, password } = req.body

        if (!phoneNo || !password) {
            return res.status(400).json({
                success: false,
                message: "Phone number and password required"
            })
            
        }

        const user = await userModel.findOne({ phoneNo })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            })
        }

        const { accessToken, refreshToken } = generateTokens(user._id.toString())

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})
        const loggedInUser = await userModel.findOne({phoneNo}).select("-password -refreshToken");
        const options: CookieOptions = {
            httpOnly:true,
            secure:false,
            sameSite:"lax"
        }

        return res
        .status(201)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json({
            message:"successfully login",
            user:loggedInUser,
            refreshToken:refreshToken
        })

    } catch (error) {
        console.log("Login error:", error)

        return res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}

export default { signup, login }