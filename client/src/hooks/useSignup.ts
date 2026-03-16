import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { signupWorker } from "../workers/auth/signupWorker";
import type { SignupPayload } from "../workers/auth/signupWorker";
import { signupResponseSchema } from "../schemas/auth/SignupResSchema";
import { validate } from "../utils/validateResSchema";

export function useSignup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  async function signup(payload: SignupPayload) {
    setIsLoading(true);
    try {
      const raw = await signupWorker(payload);
      const data = validate(signupResponseSchema, raw);

      toast.success(data.message ?? "User registered successfully");
      navigate("/login");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? err?.message ?? "Signup failed.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return { signup, isLoading };
}