import axiosInstance from "../../api/axiosInstance"

export const acceptChatRequestWorker = async (requestId:string) => {
  const res = await axiosInstance.post("/user/chat-request/accept",{
    requestId
  })
  return res.data
}