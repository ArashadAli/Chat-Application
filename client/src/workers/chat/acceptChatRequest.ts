import axiosInstance from "../../api/axiosInstance";
 
export interface AcceptChatRequestPayload {
  requestId: string;
}
 
export interface AcceptChatRequestResponse {
  message: string;
  conversation: {
    _id: string;
    participants: string[];
    [key: string]: any;
  };
}
 
export async function acceptChatRequestWorker(
  payload: AcceptChatRequestPayload
): Promise<AcceptChatRequestResponse> {
  const res = await axiosInstance.post("/user/chat-request/accept", payload);
  return res.data;
}