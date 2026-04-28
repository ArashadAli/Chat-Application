import express from "express";
import verifyJWT from "../middleware/authMiddleware";
import { uploadProfilePic } from "../config/multer";
import {
  getProfile,
  updateProfile,
  removeProfilePic,
} from "../controllers/profile.controller";

const profileRoute = express.Router();

profileRoute.get("/", verifyJWT, getProfile);

profileRoute.patch("/", verifyJWT, uploadProfilePic.single("profilePic"),updateProfile);

profileRoute.delete("/pic", verifyJWT, removeProfilePic);

export default profileRoute;