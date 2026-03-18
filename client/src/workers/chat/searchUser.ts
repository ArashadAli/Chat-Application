import axiosInstance from "../../api/axiosInstance";
 
export interface SearchedUser {
  _id: string;
  username: string;
  profilePic: string;
  phoneNo: string;
}
 
export interface SearchUserResponse {
  success: boolean;
  data: SearchedUser;
}
 
export async function searchUserWorker(phoneNo: string): Promise<SearchUserResponse> {
  const res = await axiosInstance.get(`/user/${phoneNo}`);
  return res.data;
}