import { Request, Response } from "express"
import { CookieOptions } from "express"
import bcrypt from "bcrypt"
import userModel from "../models/user.model.js"
import { generateTokens } from "../utils/generateToken.js"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import { AuthRequest } from "../types/authRequest.js"
import { logger } from "../utils/logger.js"

const signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {

    const { phoneNo, username, password } = req.body;

    if (!phoneNo || !username || !password) {
        throw new ApiError(400, "All fields are required");
    }


    const existingUser = await userModel.findOne({ phoneNo });

    if (existingUser) {
        throw new ApiError(409, "user already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await userModel.create({
        phoneNo,
        username,
        password: hashedPassword
    });

    res.status(201).json({
        success: true,
        message: "user registered successfully",
    });

});

const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {

    const { phoneNo, password } = req.body;

    // logger.info("login datails from frontend : ", req.body)

    if (!phoneNo || !password) {
        throw new ApiError(400, "Phone number and password required");
    }

    const user = await userModel.findOne({ phoneNo });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateTokens(user._id.toString());


    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const loggedInUser = await userModel
        .findOne({ phoneNo })
        .select("-password -refreshToken");

    const isProduction = process.env.NODE_ENV === "production";

    const options: CookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax"
    };

    // console.log("loggedinUser : ", loggedInUser)

    res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json({
            success: true,
            message: "Successfully logged in",
            user: loggedInUser
        });

});

const logout = asyncHandler(async (req : AuthRequest, res : Response): Promise<void> => {
    await userModel.findByIdAndUpdate(
      req.user?._id,
      {
        $set:{
          refreshToken:undefined
        }
      },
      {
        new : true
      }
    )
    const options: CookieOptions = {
        httpOnly: true,
        secure: false,
        sameSite: "none"
    };
    res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json({message:"user logged out"})
})

export default { signup, login, logout }