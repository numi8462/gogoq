import { Event } from "@/types";
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
    <div className="flex flex-col items-center gap-0.5 w-full mt-0.5">
      {/* 모바일: 점으로만, PC: 뱃지 */}
      <div className="flex gap-0.5 sm:hidden">
        {dayEvents.slice(0, 3).map((event) => (
          <span key={event.id} className="w-1 h-1 rounded-full bg-accent" />
        ))}
      </div>

      <div className="hidden sm:flex flex-col gap-0.5 w-full px-0.5">
        {dayEvents.slice(0, 2).map((event) => (
          <span
            key={event.id}
            className="text-md leading-tight bg-accent/20 text-accent
                       rounded px-1 py-0.5 w-full text-center truncate block"
          >
            {event.title.length > 6
              ? event.title.slice(0, 6) + "…"
              : event.title}
          </span>
        ))}
        {dayEvents.length > 2 && (
          <span className="text-[10px] text-text-secondary leading-tight">
            +{dayEvents.length - 2}
          </span>
        )}
      </div>
    </div>
  );
}
