import axiosInstance from "../../api/axiosInstance"

export const searchUserWorker = async (phoneNo: string) => {

  const res = await axiosInstance.get(`/user/${phoneNo}`)

  return res.data
}