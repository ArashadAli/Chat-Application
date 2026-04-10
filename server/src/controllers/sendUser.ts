import { Request, Response } from "express";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

const sendUser = async (req: Request, res: Response) => {

    const { searchId } = req.params;

    // console.log("userid :", searchId);

    if (!searchId) {
        throw new ApiError(401, "userID not Found");
    }

    const user = await User.findOne({ phoneNo: searchId }).select("-password -createdAt -__v -refreshToken");

    console.log("user :", user);

    if (!user) {
        throw new ApiError(404, "User with this phone number not exist");
    }

    res.json({
        success: true,
        data: user
    });
};

export default sendUser;