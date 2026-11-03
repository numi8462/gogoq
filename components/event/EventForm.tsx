"use client";

import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useGroupStore } from "@/lib/store/useGroupStore";
import {
  useCreateEvent,
  useDeleteEvent,
  useUpdateEvent,
} from "@/hooks/useEvents";
import { format } from "date-fns";
import { cn, EVENT_COLORS, EVENT_DOT_CLASSES } from "@/lib/utils";
import { Event, EventColor } from "@/types";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import ConfirmModal from "../ui/ConfirmModal";

const COLOR_LABEL: Record<EventColor, string> = {
  blue: "파랑",
  red: "빨강",
  green: "초록",
  purple: "보라",
  orange: "주황",
  gray: "회색",
};

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
  const titleInputId = useId();

  const [showConfirm, setShowConfirm] = useState(false);

  const { nickname } = useGroupStore();
  const { mutate: createEvent, isPending: isCreating } =
    useCreateEvent(groupId);
  const { mutate: updateEvent, isPending: isUpdating } =
    useUpdateEvent(groupId);
  const { mutate: deleteEvent, isPending: isDeleting } =
    useDeleteEvent(groupId);

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

  const handleDelete = () => {
    if (!defaultValues) return;
    deleteEvent(defaultValues.id, {
      onSuccess: () => onClose(),
      onError: (e) => {
        setShowConfirm(false);
        setError(e.message);
      },
    });
  };

  return (
    <Modal title={isEditMode ? "일정 수정" : "일정 추가"} onClose={onClose}>
      <p className="text-sm font-medium text-accent -mt-3">
        {format(selectedDate, "yyyy년 M월 d일")}
      </p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={titleInputId} className="text-xs font-medium text-text-secondary">
          게임
        </label>
        <Input
          id={titleInputId}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="예) 롤, 발로란트"
          maxLength={20}
        />
      </div>

      {/* 색상 선택 */}
      <div role="group" aria-label="색상" className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-secondary">색상</span>
        <div className="flex justify-between px-1 py-1">
          {EVENT_COLORS.map((col) => (
            <button
              key={col}
              type="button"
              aria-label={COLOR_LABEL[col]}
              aria-pressed={form.color === col}
              className={cn(
                "w-8 h-8 rounded-full transition-[transform,box-shadow] duration-150 active:scale-90",
                form.color === col
                  ? "ring-2 ring-accent ring-offset-2 ring-offset-surface scale-110"
                  : "hover:scale-110",
                EVENT_DOT_CLASSES[col],
              )}
              onClick={() => setForm({ ...form, color: col })}
            />
          ))}
        </div>
      </div>

      <div role="group" aria-label="시간" className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-secondary">시간</span>
        <div className="flex items-center gap-2 flex-wrap">
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

      <div role="group" aria-label="최대 인원" className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-secondary">최대 인원</span>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            aria-label="최대 인원 줄이기"
            className="w-10 px-0 flex items-center justify-center"
            disabled={form.maxParticipants <= 1}
            onClick={() =>
              setForm((f) => ({
                ...f,
                maxParticipants: Math.max(1, f.maxParticipants - 1),
              }))
            }
          >
            <Minus size={16} />
          </Button>
          <span
            aria-live="polite"
            className="text-base font-semibold tabular-nums text-text-primary w-6 text-center"
          >
            {form.maxParticipants}
          </span>
          <Button
            variant="secondary"
            size="sm"
            aria-label="최대 인원 늘리기"
            className="w-10 px-0 flex items-center justify-center"
            disabled={form.maxParticipants >= 10}
            onClick={() =>
              setForm((f) => ({
                ...f,
                maxParticipants: Math.min(10, f.maxParticipants + 1),
              }))
            }
          >
            <Plus size={16} />
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

      {isEditMode && (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isPending}
          className="w-full -mt-1 py-2 rounded-xl text-danger hover:bg-danger/10 text-sm font-semibold transition-colors"
        >
          삭제
        </button>
      )}

      {showConfirm && (
        <ConfirmModal
          title="일정 삭제"
          description={`'${defaultValues?.title}' 일정을 삭제할까요?`}
          confirmLabel="삭제"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setShowConfirm(false)}
        />
      )}
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
    "bg-surface border border-(--border) text-text-primary rounded-lg px-2 py-1.5 text-sm tabular-nums outline-none focus:border-accent focus:ring-3 focus:ring-accent/20 transition-[border-color,box-shadow]";

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
