import { Event } from "@/types";
import EventBadge from "./EventBadge";
import { EVENT_DOT_CLASSES } from "@/lib/utils";
import { isSameDay } from "date-fns";

type Props = {
  date: Date;
  events: Event[];
};

export default function CalendarTile({ date, events }: Props) {
  const dayEvents = events.filter((e) =>
    isSameDay(new Date(e.start_time), date),
  );

  if (dayEvents.length === 0) return null;

  return (
    <div className="flex flex-col items-start gap-0.5 w-full pb-1">
      {/* 모바일: 색상 점 */}
      <div className="flex gap-0.5 sm:hidden justify-center">
        {dayEvents.slice(0, 3).map((event) => {
          const col = event.color ?? "gray";
          const bgClass = EVENT_DOT_CLASSES[col] || "bg-teal-500";
          return (
            <span
              key={event.id}
              className={`w-2.5 h-2.5 rounded-full ${bgClass}`}
            />
          );
        })}
      </div>

      {/* PC: 최대 3개 뱃지 + 표시 */}
      <div className="hidden sm:flex flex-col gap-0.5 w-full px-0.5">
        {dayEvents.slice(0, 2).map((event) => (
          <EventBadge key={event.id} event={event} />
        ))}
        {dayEvents.length > 2 && (
          <span className="text-xs text-text-secondary leading-tight text-center py-0.5 rounded bg-surface-2">
            +{dayEvents.length - 2}개 더
          </span>
        )}
      </div>
    </div>
  );
}
