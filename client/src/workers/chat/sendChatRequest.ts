import axiosInstance from "../../api/axiosInstance";
 
export interface SendChatRequestPayload {
  phoneNo: string;
}
 
export interface SendChatRequestResponse {
  success: boolean;
  message: string;
}
 
export async function sendChatRequestWorker(
  payload: SendChatRequestPayload
): Promise<SendChatRequestResponse> {
  const res = await axiosInstance.post("/user/chat-request", payload);
  return res.data;
}