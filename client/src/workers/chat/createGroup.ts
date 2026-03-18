import axiosInstance from "../../api/axiosInstance";

export interface CreateGroupPayload {
  groupName: string;
  participants: string[];
}

export interface CreateGroupResponse {
  _id: string;
  isGroup: boolean;
  participants: string[];
  groupMetadata: {
    groupName: string;
    adminId: string;
    groupPic?: string;
  };
}

export async function createGroupWorker(payload: CreateGroupPayload): Promise<CreateGroupResponse> {
  const res = await axiosInstance.post("/user/conversation/group", payload);
  return res.data;
}