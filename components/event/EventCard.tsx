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

type Props = {
  event: Event;
  groupId: string;
};

export default function EventCard({ event, groupId }: Props) {
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
    open: "bg-green-500/10 text-green-400",
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
    <div className="rounded-xl border border-[var(--border)] bg-surface p-4 flex flex-col gap-3 transition hover:border-accent/40">
      {/* 제목 + 상태 뱃지 */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-text-primary">{event.title}</span>
        <span className={cn("text-xs px-2 py-0.5 rounded-full", statusColor)}>
          {statusLabel}
        </span>
      </div>

      {/* 시간 */}
      <div className="text-sm text-text-secondary">
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
      <span className="text-xs text-text-secondary">
        {participants.length} / {maxParticipants}명
      </span>
      <div className="flex flex-wrap gap-1.5">
        {slots.map((_, i) => {
          const participant = participants[i];
          const isMe = participant?.nickname === currentNickname;

          return (
            <span
              key={i}
              className={cn(
                "text-xs px-2 py-1 rounded-full border transition",
                participant
                  ? isMe
                    ? "bg-accent text-white border-accent"
                    : "bg-surface-2 text-text-primary border-(--border)"
                  : "bg-surface-2 text-text-secondary border-dashed border-(--border)",
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
