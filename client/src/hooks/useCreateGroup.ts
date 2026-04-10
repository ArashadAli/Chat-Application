import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { createGroupWorker } from "../workers/chat/createGroup";
import { socket } from "../socket/socket";
import type { Conversation } from "../schemas/chat/conversationListResSchema";

interface UseCreateGroupOptions {
  conversations: Conversation[];
  onGroupCreated: () => void;
}

export function useCreateGroup({ onGroupCreated }: UseCreateGroupOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  function openModal() {
    setIsOpen(true);
    setGroupName("");
    setSelectedIds([]);
  }

  function closeModal() {
    setIsOpen(false);
    setGroupName("");
    setSelectedIds([]);
  }

  function toggleParticipant(userId: string) {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  const createGroup = useCallback(async (myId: string) => {
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    if (selectedIds.length < 2) {
      toast.error("Select at least 2 members");
      return;
    }

    setIsCreating(true);
    try {
      const group = await createGroupWorker({ groupName: groupName.trim(), participants: selectedIds });

      // Notify all participants via socket so their sidebar updates live
      selectedIds.forEach((participantId) => {
        if (participantId !== myId) {
          socket.emit("notify_group_created", {
            conversationId: group._id,
            participantId,
          });
        }
      });

      toast.success("Group created");
      closeModal();
      onGroupCreated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to create group");
    } finally {
      setIsCreating(false);
    }
  }, [groupName, selectedIds, onGroupCreated]);

  return {
    isOpen,
    groupName,
    setGroupName,
    selectedIds,
    isCreating,
    openModal,
    closeModal,
    toggleParticipant,
    createGroup,
  };
}