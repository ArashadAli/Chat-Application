import axiosInstance from "../../api/axiosInstance";

export async function getConversationsWorker(): Promise<unknown> {
  const response = await axiosInstance.get("/user/conversation");
  return response.data;
}