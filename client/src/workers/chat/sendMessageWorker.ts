import axiosInstance from "../../api/axiosInstance";

export interface SendMessagePayload {
  conversationId: string;
  senderId: string;
  content: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
}

export async function sendMessageWorker(
  payload: SendMessagePayload
): Promise<SendMessageResponse> {
  const response = await axiosInstance.post("/user/message/sendMsg", payload);
  return response.data;
}