import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginWorker } from "../workers/auth/loginWorker";
import type { LoginPayload } from "../workers/auth/loginWorker";
import { loginResponseSchema } from "../schemas/auth/LoginResSchema";
import { validate } from "../utils/validateResSchema";
import { useAuthStore } from "../store/authStore";

export function useLogin() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [isLoading, setIsLoading] = useState(false);

  async function login(payload: LoginPayload) {
    setIsLoading(true);
    try {
      const raw = await loginWorker(payload);
      const data = validate(loginResponseSchema, raw);
        
    //   console.log("user from backend : ", data.user)

      setUser(data.user);
      toast.success(data.message ?? "Login successful");
      navigate("/dashboard");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? err?.message ?? "Login failed.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return { login, isLoading };
}