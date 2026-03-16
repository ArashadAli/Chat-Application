import axiosInstance from "../../api/axiosInstance";

export async function getMeWorker(): Promise<unknown> {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
}