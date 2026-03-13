import { Request, Response } from "express"
import { CookieOptions } from "express"
import bcrypt from "bcrypt"
import userModel from "../models/user.model"
import { generateTokens } from "../utils/generateToken"
import asyncHandler from "../utils/asyncHandler"
import ApiError from "../utils/ApiError"
import { logger } from "../utils/logger"

const signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {

    const { phoneNo, username, password } = req.body;

    if (!phoneNo || !username || !password) {
        throw new ApiError(400, "All fields are required");
    }

    // logger.info("user data from frontend : ", req.body)

    const existingUser = await userModel.findOne({ phoneNo });

    if (existingUser) {
        throw new ApiError(409, "user already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
        phoneNo,
        username,
        password: hashedPassword
    });

    res.status(201).json({
        success: true,
        message: "user registered successfully",
        user
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

    console.log("accessToken : ", accessToken)

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const loggedInUser = await userModel
        .findOne({ phoneNo })
        .select("-password -refreshToken");

    const options: CookieOptions = {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
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

export default { signup, login }