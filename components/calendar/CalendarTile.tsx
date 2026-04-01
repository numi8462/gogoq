import { Event } from "@/types";

type Props = {
  date: Date;
  events: Event[];
};

export default function CalendarTile({ date, events }: Props) {
  const dayEvents = events.filter((e) => {
    const eventDate = new Date(e.start_time);
    return (
      eventDate.getFullYear() === date.getFullYear() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getDate() === date.getDate()
    );
  });

  if (dayEvents.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5 mt-1">
      {dayEvents.slice(0, 2).map((event) => (
        <span
          key={event.id}
          className="text-[10px] leading-tight bg-indigo-100 text-indigo-700 
                     rounded px-1 py-0.5 truncate w-full text-left"
        >
          {event.title}
        </span>
      ))}
      {dayEvents.length > 2 && (
        <span className="text-[10px] text-gray-400">
          +{dayEvents.length - 2}
        </span>
      )}
    </div>
  );
}
