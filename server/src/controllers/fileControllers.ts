import { Response } from "express";
import path from "path";
import mongoose from "mongoose";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_BASE_URL } from "../config/s3.config";
import { AuthRequest } from "../types/authRequest";
import Message from "../models/message.model";
import Conversation from "../models/conversations.model";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import { Readable } from "stream";

function generateFileName(originalName: string): string {
  const suffix = Date.now();
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext)
    .replace(/\s+/g, "_")
    .toLowerCase();
  return `${base}-${suffix}${ext}`;
}



export const uploadFile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const conversationId = String(req.params.conversationId);
    const senderId = req.user?._id;

    if (!senderId) throw new ApiError(401, "Unauthorized");
    if (!req.file) throw new ApiError(400, "No file uploaded");
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new ApiError(400, "Invalid conversation id");
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

    const { originalname, mimetype, size, buffer } = req.file;
    const isImage = mimetype.startsWith("image/");
    const folder = isImage ? "uploads/images" : "uploads/files";
    const uniqueFileName = generateFileName(originalname);
    const s3Key = `${folder}/${uniqueFileName}`;

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: s3Key,
          Body: buffer,
          ContentType: mimetype,
          ContentDisposition: `inline; filename="${originalname}"`,
        })
      );
    } catch (err) {
      console.error("S3 upload error:", err);
      throw new ApiError(500, "Failed to upload file to S3");
    }

    const fileUrl = `${S3_BASE_URL}/${s3Key}`;
    const messageType: "image" | "file" = isImage ? "image" : "file";

    const statusArray = participants.map((participantId) => ({
      userId: new mongoose.Types.ObjectId(participantId.toString()),
      state: "sent" as const,
    }));

    const newMessage = await Message.create({
      conversationId: convObjectId,
      senderId: senderObjectId,
      content: originalname,
      messageType,
      fileMetadata: {
        originalName: originalname,
        fileName: uniqueFileName,
        mimeType: mimetype,
        size,
        url: fileUrl,
      },
      status: statusArray,
    });

    await Conversation.findByIdAndUpdate(convObjectId, {
      lastMessage: {
        text: isImage ? "📷 Image" : `📎 ${originalname}`,
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
// Streams file from S3 through backend → frontend gets progress via Content-Length

export const downloadFile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");

    const filename = String(req.params.filename);
    

    const safeFilename = path.basename(filename);

    // console.log("safeFilename : ", safeFilename)

    // Find message to get S3 key and metadata

    const message = await Message.findOne({
      "fileMetadata.fileName": safeFilename,
    }).select("fileMetadata");

    if (!message?.fileMetadata) {
      throw new ApiError(404, "File not found");
    }

    const { fileName, mimeType, originalName, size } = message.fileMetadata;

    // Determine folder from mimeType

    const isImage = mimeType.startsWith("image/");
    const s3Key = `${isImage ? "uploads/images" : "uploads/files"}/${fileName}`;

    try {
      const s3Response = await s3Client.send(
        new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: s3Key,
        })
      );

      // Set headers so browser knows file size (enables progress tracking)
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Length", size);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${originalName}"`
      );

      // Stream S3 body to response

      const stream = s3Response.Body as Readable;
      stream.pipe(res);

      // console.log("stream : ", stream)

      stream.on("error", () => {
        if (!res.headersSent) {
          res.status(500).json({ message: "Stream error" });
        }
      });
    } catch (err) {
      // console.error("S3 download error:", err);
      throw new ApiError(500, "Failed to download file from S3");
    }
  }
);