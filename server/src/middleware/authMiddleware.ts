import { Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import User from "../models/user.model";
import { AuthRequest } from "../types/authRequest";

interface DecodedToken extends JwtPayload {
  userId: string;
}

const verifyJWT = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {


    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

      console.log("token : ", token)

    if (!token) {
      throw new ApiError(401, "Access Token Required");
    }

    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as DecodedToken;

    const user = await User.findById(decodedToken.userId)
      .select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid accessToken");
    }

    req.user = user;

    next();
  }
);

export default verifyJWT;