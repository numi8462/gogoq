"use client";

import { Event } from "@/types";
import { EVENT_COLOR_HEX } from "@/lib/utils";

interface Props {
  event: Event;
}

export default function EventBadge({ event }: Props) {
  const color = EVENT_COLOR_HEX[event.color ?? "gray"];
  const displayTitle =
    event.title.length > 8 ? event.title.slice(0, 8) + "…" : event.title;

  return (
    <span
      className="block w-full truncate rounded-md border-l-[3px] px-1.5 py-0.5 text-left text-xs font-medium leading-tight text-text-primary transition hover:opacity-80"
      // 일정 색을 옅게 깔고 왼쪽 띠로만 강조한다. 글자는 기본 글자색이라 어느 테마, 어느 칸 위에서도 읽힌다.
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
        borderLeftColor: color,
      }}
    >
      {displayTitle}
    </span>
  );
}
