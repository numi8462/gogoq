"use client";

import { useState } from "react";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { useUpdateGroupName } from "@/hooks/useMyGroups";

type Props = {
  groupId: string;
  currentName: string;
  onClose: () => void;
  onSaved?: (name: string) => void;
};

export default function EditGroupNameModal({
  groupId,
  currentName,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState(currentName);
  const { mutate, isPending, error } = useUpdateGroupName();

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    mutate(
      { id: groupId, name: trimmed },
      {
        onSuccess: () => {
          onSaved?.(trimmed);
          onClose();
        },
      },
    );
  };

  return (
    <Modal title="그룹 이름 수정" onClose={onClose}>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        placeholder="그룹 이름"
        maxLength={30}
        autoFocus
      />
      {error && (
        <p className="text-xs text-danger -mt-1">
          이름을 저장하지 못했어요. 다시 시도해주세요.
        </p>
      )}
      <Button
        onClick={handleSave}
        disabled={!name.trim()}
        isLoading={isPending}
        className="w-full"
      >
        저장
      </Button>
    </Modal>
  );
}
