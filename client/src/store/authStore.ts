// src/store/authStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  _id: string;
  phoneNo: string;
  username: string;
}

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
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
      name: "auth-storage", // persisted in localStorage
    }
  )
);