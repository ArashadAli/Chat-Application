import axiosInstance from "../../api/axiosInstance";


export async function updateMsgWorker(
  msgId: string,
  content: string
): Promise<{ success: boolean; message: any }> {
  const res = await axiosInstance.patch(`/user/message/updateMsg/${msgId}`, { content });
  return res.data;
}

export async function deleteMsgWorker(
  msgId: string
): Promise<{ success: boolean; messageId: string }> {
  const res = await axiosInstance.post(`/user/message/delete/${msgId}`);
  return res.data;
}