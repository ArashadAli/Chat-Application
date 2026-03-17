import axiosInstance from "../../api/axiosInstance"

export const sendChatRequestWorker = async (receiverId:string) => {
  const res = await axiosInstance.post("/user/chat-request",{
    receiverId
  })
  return res.data
}