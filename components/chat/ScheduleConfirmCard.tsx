import { format, parseISO } from "date-fns";
import { Check, Pencil, Trash2, X } from "lucide-react";
import Button from "@/components/common/Button";
import { cn, EVENT_DOT_CLASSES } from "@/lib/utils";
import { ScheduleAction, ScheduleAttrs } from "./types";

interface Props {
  action: ScheduleAction;
  attrs: ScheduleAttrs;
  dateCorrected?: boolean;
  status: "pending" | "confirmed" | "cancelled";
  error?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ACTION_LABEL: Record<ScheduleAction, string> = {
  create: "일정 추가",
  update: "일정 수정",
  delete: "일정 삭제",
};

const CONFIRMED_LABEL: Record<ScheduleAction, string> = {
  create: "✓ 일정에 추가했어요",
  update: "✓ 일정을 수정했어요",
  delete: "✓ 일정을 삭제했어요",
};

export default function ScheduleConfirmCard({
  action,
  attrs,
  dateCorrected,
  status,
  error,
  isLoading,
  onConfirm,
  onCancel,
}: Props) {
  const dateLabel = format(parseISO(attrs.date), "yyyy년 M월 d일");

  return (
    <div className="rounded-xl border border-(--border) bg-surface-2 p-3 flex flex-col gap-2 max-w-[85%]">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "w-2.5 h-2.5 rounded-full shrink-0",
            EVENT_DOT_CLASSES[attrs.color ?? "blue"],
          )}
        />
        <p className="text-sm font-semibold text-text-primary truncate">
          {attrs.title}
        </p>
      </div>
      <p className="text-xs text-text-secondary">
        {dateLabel} · {attrs.start_time} ~ {attrs.end_time} · 최대{" "}
        {attrs.max_participants}명
      </p>
      {dateCorrected && (
        <p className="text-[11px] text-accent">
          날짜 표현을 다시 계산해서 보정했어요.
        </p>
      )}
      {action === "delete" && status === "pending" && (
        <p className="text-[11px] text-danger">이 일정을 삭제할까요?</p>
      )}

      {status === "pending" && (
        <div className="flex gap-2 mt-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 flex items-center justify-center gap-1"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X size={14} />
            취소
          </Button>
          <Button
            variant={action === "delete" ? "danger" : "primary"}
            size="sm"
            className="flex-1 flex items-center justify-center gap-1"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {action === "delete" ? (
              <Trash2 size={14} />
            ) : action === "update" ? (
              <Pencil size={14} />
            ) : (
              <Check size={14} />
            )}
            {ACTION_LABEL[action]}
          </Button>
        </div>
      )}
      {status === "confirmed" && (
        <p className="text-xs text-accent font-medium">
          {CONFIRMED_LABEL[action]}
        </p>
      )}
      {status === "cancelled" && (
        <p className="text-xs text-text-secondary">취소했어요</p>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
