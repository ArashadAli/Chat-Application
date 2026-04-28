import { Response } from "express";
import fs from "fs";
import cloudinary from "../config/cloudinary.config";
import { AuthRequest } from "../types/authRequest";
import User from "../models/user.model";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";


function deleteTempFile(filePath?: string) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    
  }
}

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(req.user._id).select(
    "-password -refreshToken -profilePicPublicId"
  );
  if (!user) throw new ApiError(404, "User not found");

  res.status(200).json({ success: true, user });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, "Unauthorized");

  const { username, quote } = req.body;
  const localFilePath = req.file?.path;

  
  if (username === undefined && quote === undefined && !req.file) {
    throw new ApiError(400, "Provide at least one field to update");
  }

  const update: Record<string, string> = {};

  // ── Validate text fields ──────────────────────────────────────────────────
  if (username !== undefined) {
    const trimmed = String(username).trim();
    if (!trimmed) {
      deleteTempFile(localFilePath);
      throw new ApiError(400, "Username cannot be empty");
    }
    if (trimmed.length > 50) {
      deleteTempFile(localFilePath);
      throw new ApiError(400, "Username must be 50 characters or less");
    }
    update.username = trimmed;
  }

  if (quote !== undefined) {
    const trimmed = String(quote).trim();
    if (trimmed.length > 139) {
      deleteTempFile(localFilePath);
      throw new ApiError(400, "Quote must be 139 characters or less");
    }
    update.quote = trimmed;
  }

  // ── Handle profile pic upload ─────────────────────────────────────────────
  if (req.file) {
    try {

      const existingUser = await User.findById(req.user._id).select("profilePicPublicId");

      // 2. Upload new image to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(localFilePath!, {
        folder: "chat-app/profile-pics",
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
      });

      if (existingUser?.profilePicPublicId) {
        await cloudinary.uploader
          .destroy(existingUser.profilePicPublicId)
          .catch(() => {}); // silent — old pic deletion must never block update
      }

      // 4. Add to update payload
      update.profilePic = uploadResult.secure_url;
      update.profilePicPublicId = uploadResult.public_id;
    } finally {
      
      deleteTempFile(localFilePath);
    }
  }

  // ── Save everything in one DB call ───────────────────────────────────────
  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { $set: update },
    { new: true }
  ).select("-password -refreshToken -profilePicPublicId");

  if (!updated) throw new ApiError(404, "User not found");

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: updated,
  });
});

export const removeProfilePic = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  if (!user.profilePic) {
    throw new ApiError(400, "No profile picture to remove");
  }

  if (user.profilePicPublicId) {
    await cloudinary.uploader.destroy(user.profilePicPublicId).catch(() => {});
  }

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { profilePic: "", profilePicPublicId: "" } },
    { new: true }
  ).select("-password -refreshToken -profilePicPublicId");

  res.status(200).json({
    success: true,
    message: "Profile picture removed",
    user: updated,
  });
});