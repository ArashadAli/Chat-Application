import axiosInstance from "../../api/axiosInstance";
 
export async function getConversationMessagesWorker(
  conversationId: string
): Promise<unknown> {
  const response = await axiosInstance.get(`/user/conversation/${conversationId}`);
//   console.log("conversationMsg from getCon : ", response.data)
  return response.data;
}