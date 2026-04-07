"use client";

import { useState } from "react";
import { useGroupStore } from "@/lib/store/useGroupStore";
import { useCreateEvent, useUpdateEvent } from "@/hooks/useEvents";
import { format } from "date-fns";
import { cn, EVENT_DOT_CLASSES } from "@/lib/utils";
import { Event, EventColor } from "@/types";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

interface EventFormProps {
  groupId: string;
  selectedDate: Date;
  onClose: () => void;
  defaultValues?: Event;
}

export default function EventForm({
  groupId,
  selectedDate,
  onClose,
  defaultValues,
}: EventFormProps) {
  const isEditMode = !!defaultValues;

  const { nickname } = useGroupStore();
  const { mutate: createEvent, isPending: isCreating } =
    useCreateEvent(groupId);
  const { mutate: updateEvent, isPending: isUpdating } =
    useUpdateEvent(groupId);
  const isPending = isCreating || isUpdating;

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const [form, setForm] = useState(() => {
    if (defaultValues) {
      const start = new Date(defaultValues.start_time);
      const end = new Date(defaultValues.end_time);
      return {
        title: defaultValues.title,
        color: defaultValues.color,
        startHour: String(start.getHours()).padStart(2, "0"),
        startMin: String(start.getMinutes()).padStart(2, "0"),
        endHour: String(end.getHours()).padStart(2, "0"),
        endMin: String(end.getMinutes()).padStart(2, "0"),
        maxParticipants: defaultValues.max_participants,
      };
    }
    return {
      title: "",
      color: "blue" as EventColor,
      startHour: "20",
      startMin: "00",
      endHour: "22",
      endMin: "00",
      maxParticipants: 5,
    };
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!form.title.trim()) return;

    const start_time = new Date(
      `${dateStr}T${form.startHour}:${form.startMin}:00`,
    ).toISOString();
    const end_time = new Date(
      `${dateStr}T${form.endHour}:${form.endMin}:00`,
    ).toISOString();

    const payload = {
      group_id: groupId,
      title: form.title.trim(),
      color: form.color,
      start_time,
      end_time,
      max_participants: form.maxParticipants,
    };

    if (isEditMode) {
      updateEvent(
        { id: defaultValues.id, ...payload },
        {
          onSuccess: () => onClose(),
          onError: (e) => setError(e.message),
        },
      );
    } else {
      createEvent(payload, {
        onSuccess: () => onClose(),
        onError: (e) => setError(e.message),
      });
    }
  };

  return (
    <Modal title={isEditMode ? "일정 수정" : "일정 추가"} onClose={onClose}>
      <p className="text-xs text-accent -mt-2">
        {format(selectedDate, "yyyy년 M월 d일")}
      </p>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-secondary">게임</label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="예) 롤, 발로란트"
          maxLength={20}
        />
      </div>

      {/* 색상 선택 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-secondary">색상</label>
        <div className="flex justify-between p-2 bg-surface-2 rounded-lg">
          {["blue", "red", "green", "purple", "orange", "gray"].map((col) => (
            <Button
              key={col}
              variant="ghost"
              size="sm"
              className={cn(
                "w-10 h-10 p-0 rounded-full border-2 shadow-sm transition-all duration-200",
                form.color === col
                  ? "border-accent ring-2 ring-accent shadow-lg"
                  : "border-transparent",
                EVENT_DOT_CLASSES[col as EventColor],
              )}
              onClick={() => setForm({ ...form, color: col as EventColor })}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-secondary">시간</label>
        <div className="flex items-center gap-2">
          <TimeSelect
            hour={form.startHour}
            min={form.startMin}
            onChangeHour={(v) => setForm({ ...form, startHour: v })}
            onChangeMin={(v) => setForm({ ...form, startMin: v })}
          />
          <span className="text-text-secondary text-sm">~</span>
          <TimeSelect
            hour={form.endHour}
            min={form.endMin}
            onChangeHour={(v) => setForm({ ...form, endHour: v })}
            onChangeMin={(v) => setForm({ ...form, endMin: v })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-secondary">최대 인원</label>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setForm((f) => ({
                ...f,
                maxParticipants: Math.max(1, f.maxParticipants - 1),
              }))
            }
          >
            −
          </Button>
          <span className="text-sm font-medium text-text-primary w-6 text-center">
            {form.maxParticipants}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setForm((f) => ({
                ...f,
                maxParticipants: Math.min(10, f.maxParticipants + 1),
              }))
            }
          >
            +
          </Button>
        </div>
      </div>

      <p className="text-xs text-text-secondary">작성자: {nickname}</p>

      {error && <p className="text-xs text-danger">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={!form.title.trim()}
        isLoading={isPending}
        className="w-full"
      >
        {isEditMode ? "일정 수정" : "일정 등록"}
      </Button>
      {/* <Button
        variant="danger"
        onClick={handleSubmit}
        disabled={!form.title.trim()}
        isLoading={isPending}
        className="w-full"
      >
        삭제
      </Button> */}
    </Modal>
  );
}

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
    "bg-surface-2 border border-[var(--border)] text-text-primary rounded-lg px-2 py-1.5 text-sm outline-none focus:border-accent transition";

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
