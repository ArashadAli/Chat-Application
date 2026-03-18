import axiosInstance from "../../api/axiosInstance";
 
export interface ChatRequestSender {
  _id: string;
  username: string;
  profilePic: string;
}
 
export interface ChatRequest {
  _id: string;
  senderId: ChatRequestSender;
}
 
export async function getChatRequestsWorker(): Promise<ChatRequest[]> {
  const res = await axiosInstance.get("/user/chat-request");
  return res.data;
}