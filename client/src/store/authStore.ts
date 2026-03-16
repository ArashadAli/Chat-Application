import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LoginUser } from "../schemas/auth/LoginResSchema";

interface AuthState {
  user: LoginUser | null;
  setUser: (user: LoginUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: "auth-storage",
    }
  )
);