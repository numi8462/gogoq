"use client";

import { useState } from "react";
import { useGroupStore } from "@/lib/store/useGroupStore";
import { useCreateEvent } from "@/hooks/useEvents";
import { format } from "date-fns";

type Props = {
  groupId: string;
  selectedDate: Date;
  onClose: () => void;
};

export default function EventForm({ groupId, selectedDate, onClose }: Props) {
  const { nickname } = useGroupStore();
  const { mutate: createEvent, isPending } = useCreateEvent(groupId);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const [form, setForm] = useState({
    title: "",
    startHour: "20",
    startMin: "00",
    endHour: "22",
    endMin: "00",
    maxParticipants: 4,
  });

  const handleSubmit = () => {
    if (!form.title.trim()) return;

    const start_time = new Date(
      `${dateStr}T${form.startHour}:${form.startMin}:00`,
    ).toISOString();
    const end_time = new Date(
      `${dateStr}T${form.endHour}:${form.endMin}:00`,
    ).toISOString();

    createEvent(
      {
        group_id: groupId,
        title: form.title.trim(),
        start_time,
        end_time,
        max_participants: form.maxParticipants,
      },
      {
        onSuccess: () => onClose(),
        onError: (e) => alert(e.message),
      },
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 flex flex-col gap-4 shadow-lg">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">일정 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 날짜 표시 */}
        <p className="text-sm text-indigo-500 font-medium">
          {format(selectedDate, "yyyy년 M월 d일")}
        </p>

        {/* 게임 이름 */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">게임</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="예) 롤, 발로란트"
            maxLength={20}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                       outline-none focus:border-indigo-400 transition"
          />
        </div>

        {/* 시간 설정 */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">시간</label>
          <div className="flex items-center gap-2">
            <TimeSelect
              hour={form.startHour}
              min={form.startMin}
              onChangeHour={(v) => setForm({ ...form, startHour: v })}
              onChangeMin={(v) => setForm({ ...form, startMin: v })}
            />
            <span className="text-gray-400 text-sm">~</span>
            <TimeSelect
              hour={form.endHour}
              min={form.endMin}
              onChangeHour={(v) => setForm({ ...form, endHour: v })}
              onChangeMin={(v) => setForm({ ...form, endMin: v })}
            />
          </div>
        </div>

        {/* 최대 인원 */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">최대 인원</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  maxParticipants: Math.max(1, f.maxParticipants - 1),
                }))
              }
              className="w-8 h-8 rounded-full border border-gray-200 text-gray-600
                         hover:bg-gray-50 transition text-lg leading-none"
            >
              −
            </button>
            <span className="text-sm font-medium w-6 text-center">
              {form.maxParticipants}
            </span>
            <button
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  maxParticipants: Math.min(10, f.maxParticipants + 1),
                }))
              }
              className="w-8 h-8 rounded-full border border-gray-200 text-gray-600
                         hover:bg-gray-50 transition text-lg leading-none"
            >
              +
            </button>
          </div>
        </div>

        {/* 작성자 */}
        <p className="text-xs text-gray-400">작성자: {nickname}</p>

        {/* 제출 */}
        <button
          onClick={handleSubmit}
          disabled={!form.title.trim() || isPending}
          className="bg-indigo-500 text-white rounded-lg py-2.5 text-sm font-medium
                     hover:bg-indigo-600 transition disabled:opacity-40"
        >
          {isPending ? "등록 중..." : "일정 등록"}
        </button>
      </div>
    </div>
  );
}

// 시간 선택 서브 컴포넌트
function TimeSelect({
  hour,
  min,
  onChangeHour,
  onChangeMin,
}: {
  hour: string;
  min: string;
  onChangeHour: (v: string) => void;
  onChangeMin: (v: string) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0"),
  );
  const mins = ["00", "30"];

  const selectClass =
    "border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none \
     focus:border-indigo-400 transition bg-white";

  return (
    <div className="flex items-center gap-1">
      <select
        value={hour}
        onChange={(e) => onChangeHour(e.target.value)}
        className={selectClass}
      >
        {hours.map((h) => (
          <option key={h} value={h}>
            {h}시
          </option>
        ))}
      </select>
      <select
        value={min}
        onChange={(e) => onChangeMin(e.target.value)}
        className={selectClass}
      >
        {mins.map((m) => (
          <option key={m} value={m}>
            {m}분
          </option>
        ))}
      </select>
    </div>
  );
}
