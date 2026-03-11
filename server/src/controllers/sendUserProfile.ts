import { AuthRequest } from "../types/authRequest";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import { Response } from "express";
const sendUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {

  const user = req.user;

  console.log("user : ", user)

  if (!user) {
    throw new ApiError(401, "User not valid");
  }

  res
  .status(200)
  .json({
    message:"user profile fetched",
    user
  })

});

export default sendUserProfile