import axiosInstance from "../../api/axiosInstance";

export interface SignupPayload {
  phoneNo: string;
  password: string;
  username: string;
}

export async function signupWorker(payload: SignupPayload): Promise<unknown> {
  const response = await axiosInstance.post("/auth/signup", payload);
  return response.data;
}