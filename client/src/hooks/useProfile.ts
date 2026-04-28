import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import {
  getProfileWorker,
  updateProfileWorker,
  removeProfilePicWorker,
  type UpdateProfilePayload,
} from "../workers/profile/profileWorker";

export function useProfile() {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync latest profile from server
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const updated = await getProfileWorker();
      
      setUser({ ...user!, ...updated });
    } catch {
      
    } finally {
      setIsLoading(false);
    }
  }, [user, setUser]);

  
  const updateProfile = useCallback(
    async (payload: UpdateProfilePayload): Promise<boolean> => {
      setIsSaving(true);
      try {
        const updated = await updateProfileWorker(payload);
        setUser({ ...user!, ...updated });
        toast.success("Profile updated");
        return true;
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? "Failed to update profile");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [user, setUser]
  );

  // Remove profile picture
  const removeProfilePic = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      const updated = await removeProfilePicWorker();
      setUser({ ...user!, ...updated });
      toast.success("Profile picture removed");
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to remove picture");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, setUser]);

  return { user, isLoading, isSaving, fetchProfile, updateProfile, removeProfilePic };
}