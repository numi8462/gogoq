"use client";

import { useState } from "react";
import { useGroupStore } from "@/lib/store/useGroupStore";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

export default function NicknameModal() {
  const { nickname, setNickname } = useGroupStore();
  const [input, setInput] = useState("");

  if (nickname) return null;

  const handleConfirm = () => {
    if (input.trim()) setNickname(input.trim());
  };

  return (
    <Modal title="닉네임 입력">
      <p className="text-xs text-text-secondary -mt-2">
        일정 참여 시 사용할 닉네임을 입력해주세요
      </p>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
        placeholder="예) 고고큐짱"
        maxLength={12}
        autoFocus
      />
      <Button
        onClick={handleConfirm}
        disabled={!input.trim()}
        className="w-full"
      >
        시작하기
      </Button>
    </Modal>
  );
}
