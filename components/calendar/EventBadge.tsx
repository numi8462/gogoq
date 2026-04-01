"use client";

import { Event } from "@/types";
import { cn, EVENT_BADGE_CLASSES } from "@/lib/utils";

interface Props {
  event: Event;
}

export default function EventBadge({ event }: Props) {
  const colorClass = EVENT_BADGE_CLASSES[event.color ?? "gray"];
  const displayTitle =
    event.title.length > 8 ? event.title.slice(0, 8) + "…" : event.title;

  return (
    <span
      className={cn(
        "text-xs sm:text-sm leading-tight rounded px-1 py-0.5 w-full text-center truncate block hover:opacity-80 transition font-medium",
        colorClass,
      )}
    >
      {displayTitle}
    </span>
  );
}
