export interface SignupResponse {
  success: boolean;
  message: string;
}

export const signupResponseSchema = {
  validate(data: unknown): SignupResponse {
    if (
      typeof data !== "object" ||
      data === null ||
      typeof (data as any).success !== "boolean" ||
      typeof (data as any).message !== "string"
    ) {
      throw new Error("Invalid signup response shape");
    }
    return data as SignupResponse;
  },
};