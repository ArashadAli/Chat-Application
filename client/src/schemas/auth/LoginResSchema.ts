export interface LoginUser {
  _id: string;
  phoneNo: string;
  username: string;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
  profilePic?: string;
  __v: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: LoginUser;
}

export const loginResponseSchema = {
  validate(data: unknown): LoginResponse {
    if (
      typeof data !== "object" ||
      data === null
    ) {
      throw new Error("Invalid login response: not an object");
    }

    const d = data as any;

    if (typeof d.success !== "boolean") {
      throw new Error("Invalid login response: missing 'success'");
    }
    if (typeof d.message !== "string") {
      throw new Error("Invalid login response: missing 'message'");
    }
    if (typeof d.user !== "object" || d.user === null) {
      throw new Error("Invalid login response: missing 'user'");
    }

    const u = d.user;
    if (
      typeof u._id !== "string" ||
      typeof u.phoneNo !== "string" ||
      typeof u.username !== "string" ||
      typeof u.isOnline !== "boolean"
    ) {
      throw new Error("Invalid login response: malformed 'user' object");
    }

    return data as LoginResponse;
  },
};