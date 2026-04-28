import axiosInstance from "../../api/axiosInstance";

export interface UserProfile {
  _id: string;
  username: string;
  phoneNo: string;
  profilePic?: string;
  quote?: string;
  isOnline: boolean;
}

export interface UpdateProfilePayload {
  username?: string;
  quote?: string;
  profilePic?: File;
}


export async function getProfileWorker(): Promise<UserProfile> {
  const res = await axiosInstance.get("/user/profile");
  return res.data.user;
}

export async function updateProfileWorker(
  payload: UpdateProfilePayload
): Promise<UserProfile> {
  const form = new FormData();
  if (payload.username !== undefined) form.append("username", payload.username);
  if (payload.quote !== undefined) form.append("quote", payload.quote);
  if (payload.profilePic) form.append("profilePic", payload.profilePic);

  const res = await axiosInstance.patch("/user/profile", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.user;
}

export async function removeProfilePicWorker(): Promise<UserProfile> {
  const res = await axiosInstance.delete("/user/profile/pic");
  return res.data.user;
}