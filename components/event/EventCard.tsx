"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  useParticipants,
  useJoinEvent,
  useLeaveEvent,
} from "@/hooks/useParticipants";
import { useGroupStore } from "@/lib/store/useGroupStore";
import Button from "@/components/common/Button";
import { cn } from "@/lib/utils";
import { Event } from "@/types";
import { Pencil } from "lucide-react";

interface EventCardProps {
  event: Event;
  groupId: string;
  onEdit?: (event: Event) => void;
}

export default function EventCard({ event, groupId, onEdit }: EventCardProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { nickname } = useGroupStore();
  const { data: participants = [] } = useParticipants(event.id);
  const { mutate: join, isPending: isJoining } = useJoinEvent(
    groupId,
    event.id,
  );
  const { mutate: leave, isPending: isLeaving } = useLeaveEvent(
    groupId,
    event.id,
  );

  const isJoined = participants.some((p) => p.nickname === nickname);
  const isFull = participants.length >= event.max_participants;
  const isPending = isJoining || isLeaving;

  const statusLabel = {
    open: "모집중",
    closed: "마감",
    cancelled: "취소됨",
  }[event.status];

  const statusColor = {
    open: "bg-success/12 text-success",
    closed: "bg-surface-2 text-text-secondary",
    cancelled: "bg-danger/10 text-danger",
  }[event.status];

  const handleToggle = () => {
    if (!nickname) return;
    setErrorMsg(null);

    if (isJoined) {
      leave(
        { eventId: event.id, nickname },
        { onError: (e) => setErrorMsg(e.message) },
      );
    } else {
      join(
        { eventId: event.id, nickname },
        { onError: (e) => setErrorMsg(e.message) },
      );
    }
  };

  return (
    <div className="rounded-2xl border border-(--border) bg-surface p-4 flex flex-col gap-3">
      {/* 제목 + 상태 뱃지 + 수정 버튼 */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold tracking-[-0.01em] text-text-primary min-w-0 break-words">
          {event.title}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusColor)}>
            {statusLabel}
          </span>
          {onEdit && (
            <button
              onClick={() => onEdit(event)}
              aria-label={`${event.title} 일정 수정`}
              className="-mr-1.5 p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 시간 */}
      <div className="-mt-1 text-sm font-medium tabular-nums text-text-primary">
        {format(new Date(event.start_time), "HH:mm", { locale: ko })}
        {" ~ "}
        {format(new Date(event.end_time), "HH:mm", { locale: ko })}
      </div>

      {/* 참여자 슬롯 */}
      <ParticipantList
        participants={participants}
        maxParticipants={event.max_participants}
        currentNickname={nickname}
      />

      {/* 참여 / 취소 버튼 */}
      {event.status !== "cancelled" && (
        <Button
          onClick={handleToggle}
          disabled={isPending || (!isJoined && isFull)}
          isLoading={isPending}
          variant={isJoined ? "secondary" : isFull ? "ghost" : "primary"}
          className="w-full"
        >
          {isJoined ? "참여 취소" : isFull ? "마감됨" : "참여하기"}
        </Button>
      )}

      {errorMsg && (
        <p className="text-xs text-danger text-center">{errorMsg}</p>
      )}
    </div>
  );
}

function ParticipantList({
  participants,
  maxParticipants,
  currentNickname,
}: {
  participants: { id: string; nickname: string }[];
  maxParticipants: number;
  currentNickname: string;
}) {
  const slots = Array.from({ length: maxParticipants });

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-text-secondary tabular-nums">
        참여 {participants.length} / {maxParticipants}명
      </span>
      <div className="flex flex-wrap gap-1.5">
        {slots.map((_, i) => {
          const participant = participants[i];
          const isMe = participant?.nickname === currentNickname;

          return (
            <span
              key={i}
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full border",
                participant
                  ? isMe
                    ? "bg-accent text-white border-accent"
                    : "bg-surface-2 text-text-primary border-(--border)"
                  : "text-text-secondary border-dashed border-(--border)",
              )}
            >
              {participant ? participant.nickname : "대기중"}
            </span>
          );
        })}
      </div>
    </div>
  );
}
