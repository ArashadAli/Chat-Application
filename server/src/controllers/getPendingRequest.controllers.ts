import {  Response } from "express";
import chatRequest from "../models/chatRequest.model";
import { AuthRequest } from "../types/authRequest";

const getPendingRequest = async (req : AuthRequest, res : Response) => {
    
  const userId = req.user?._id

  // console.log("userId from getPendingRequest : ", userId)

  const requests = await chatRequest.find({
    receiverId:userId,
    status:"pending"
  }).populate("senderId","username profilePic")

  console.log("geting pending request : ", requests)

  res.json(requests)
}

export default getPendingRequest