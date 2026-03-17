import axiosInstance from "../../api/axiosInstance"

export const getChatRequestsWorker = async () => {
  const res = await axiosInstance.get("/user/chat-request")
  return res.data
}