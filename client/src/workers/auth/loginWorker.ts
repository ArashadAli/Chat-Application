import axiosInstance from "../../api/axiosInstance";

export interface LoginPayload {
  phoneNo: string;
  password: string;
}

export async function loginWorker(payload: LoginPayload): Promise<unknown> {
  const response = await axiosInstance.post("/auth/login", payload);
  return response.data;
}