import axiosInstance from "../../api/axiosInstance";

export async function logoutWorker(): Promise<void> {
  await axiosInstance.get("/auth/logout");
}