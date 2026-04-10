import { Request } from "express";
import { IUser } from "../models/user.model.js";

export interface AuthRequest extends Request {
  user?: IUser;
}