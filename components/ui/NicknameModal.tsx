"use client";

import { useState } from "react";
import { useGroupStore } from "@/lib/store/useGroupStore";

export default function NicknameModal() {
  const { nickname, setNickname } = useGroupStore();
  const [input, setInput] = useState("");

  if (nickname) return null; // 닉네임 있으면 안 보임

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-80 flex flex-col gap-4 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-800">닉네임 입력</h2>
        <p className="text-sm text-gray-500">
          일정 참여 시 사용할 닉네임을 입력해주세요
        </p>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) setNickname(input.trim());
          }}
          placeholder="예) 고고큐짱"
          maxLength={12}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm 
                     outline-none focus:border-indigo-400 transition"
        />
        <button
          onClick={() => {
            if (input.trim()) setNickname(input.trim());
          }}
          disabled={!input.trim()}
          className="bg-indigo-500 text-white rounded-lg py-2 text-sm font-medium
                     hover:bg-indigo-600 transition disabled:opacity-40"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
