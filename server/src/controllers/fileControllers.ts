import { Response } from "express";
import path from "path";
import mongoose from "mongoose";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../config/s3.config";
import { AuthRequest } from "../types/authRequest.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversations.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateFileName(originalName: string): string {
  const suffix = Date.now();
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext)
    .replace(/\s+/g, "_")
    .toLowerCase();
  return `${base}-${suffix}${ext}`;
}

const IMAGE_MIME_TYPES = [
  "image/jpeg", "image/jpg", "image/pdf"
];


export const getPresignedUploadUrl = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");

    const fileName = String(req.query.fileName ?? "");
    const mimeType = String(req.query.mimeType ?? "");
    const conversationId = String(req.query.conversationId ?? "");

    if (!fileName || !mimeType || !conversationId) {
      throw new ApiError(400, "fileName, mimeType and conversationId are required");
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new ApiError(400, "Invalid conversationId");
    }

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId).select("participants");
    if (!conversation) throw new ApiError(404, "Conversation not found");

    const isParticipant = (conversation.participants as mongoose.Types.ObjectId[]).some(
      (p) => p.toString() === req.user!._id.toString()
    );
    if (!isParticipant) throw new ApiError(403, "Not a participant");

    const isImage = IMAGE_MIME_TYPES.includes(mimeType);
    const folder = isImage ? "uploads/images" : "uploads/files";
    const uniqueFileName = generateFileName(fileName);
    const s3Key = `${folder}/${uniqueFileName}`;

    // Generate presigned PUT URL — valid for 5 minutes
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      ContentType: mimeType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    res.status(200).json({
      presignedUrl,       // Frontend is URL pe PUT karega
      s3Key,              // Frontend message save karne ke liye use karega
      uniqueFileName,     // DB mein store hoga
      messageType: isImage ? "image" : "file",
    });
  }
);

// ── POST /api/user/conversation/:conversationId/save-file-message ─────────────
// File S3 pe upload hone ke BAAD frontend yeh call karta hai
// Sirf DB mein message save karta hai
export const saveFileMessage = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const conversationId = String(req.params.conversationId);
    const senderId = req.user?._id;

    if (!senderId) throw new ApiError(401, "Unauthorized");
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new ApiError(400, "Invalid conversationId");
    }

    const { originalName, uniqueFileName, mimeType, size, messageType, s3Key } = req.body;

    if (!originalName || !uniqueFileName || !mimeType || !size || !messageType || !s3Key) {
      throw new ApiError(400, "Missing file metadata");
    }

    const convObjectId = new mongoose.Types.ObjectId(conversationId);
    const senderObjectId = new mongoose.Types.ObjectId(String(senderId));

    const conversation = await Conversation.findById(convObjectId).select("participants");
    if (!conversation) throw new ApiError(404, "Conversation not found");

    const participants = conversation.participants as mongoose.Types.ObjectId[];
    const isParticipant = participants.some(
      (p) => p.toString() === senderObjectId.toString()
    );
    if (!isParticipant) throw new ApiError(403, "Not a participant");

    const statusArray = participants.map((participantId) => ({
      userId: new mongoose.Types.ObjectId(participantId.toString()),
      state: "sent" as const,
    }));

    const newMessage = await Message.create({
      conversationId: convObjectId,
      senderId: senderObjectId,
      content: originalName,
      messageType,
      fileMetadata: {
        originalName,
        fileName: uniqueFileName,
        mimeType,
        size,
        url: s3Key,   // S3 key store karo (public URL nahi)
      },
      status: statusArray,
    });

    await Conversation.findByIdAndUpdate(convObjectId, {
      lastMessage: {
        text: messageType === "image" ? "📷 Image" : `📎 ${originalName}`,
        senderId: senderObjectId,
        timestamp: new Date(),
      },
    });

    const populated = await Message.findById(newMessage._id).populate(
      "senderId",
      "username profilePic"
    );

    res.status(201).json({ success: true, message: populated });
  }
);

// ── GET /api/user/files/:filename ─────────────────────────────────────────────
// Presigned GET URL generate karta hai — frontend directly S3 se file fetch karega
export const getPresignedDownloadUrl = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");

    const filename = String(req.params.filename);
    const safeFilename = path.basename(filename);

    const message = await Message.findOne({
      "fileMetadata.fileName": safeFilename,
    }).select("fileMetadata");

    if (!message?.fileMetadata) {
      throw new ApiError(404, "File not found");
    }

    const { fileName, mimeType, url: s3Key } = message.fileMetadata;

    // s3Key already stored as "uploads/images/filename.jpg"
    const key = s3Key.startsWith("uploads/") ? s3Key : `uploads/${fileName}`;

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });

    // Generate presigned GET URL — valid for 1 hour
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    res.status(200).json({ presignedUrl, mimeType });
  }
);