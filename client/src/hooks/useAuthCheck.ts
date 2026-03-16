import { useEffect, useState } from "react";
import { getMeWorker } from "../workers/auth/getMeWorker";
import { useAuthStore } from "../store/authStore";

export function useAuthCheck() {
  const setUser = useAuthStore((s) => s.setUser);
  const logout  = useAuthStore((s) => s.logout);

  
  const [status, setStatus] = useState<"pending" | "authorized" | "unauthorized">("pending");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const raw = await getMeWorker() as any;

        if (cancelled) return;

        if (raw?.success && raw?.loggedInUser) {
          setUser(raw.loggedInUser);
          setStatus("authorized");
        } else {
          logout();
          setStatus("unauthorized");
        }
      } catch {
        if (!cancelled) {
          logout();
          setStatus("unauthorized");
        }
      }
    }

    verify();
    return () => { cancelled = true; };
  }, []);

  return status;
}