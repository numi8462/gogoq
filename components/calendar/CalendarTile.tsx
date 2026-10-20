import { Event } from "@/types";
import EventBadge from "./EventBadge";

type Props = {
  /** 이 날짜의 일정. 캘린더가 날짜별로 미리 나눠서 넘긴다. */
  events: Event[];
};

/**
 * 날짜 칸 안의 일정 제목 배지. PC에서만 2개까지 보여준다.
 * 일정 개수는 날짜 옆 깃발(EventFlags)이 알려주므로, 모바일에서는 깃발만 둔다.
 */
export default function CalendarTile({ events }: Props) {
  if (events.length === 0) return null;

  return (
    <div className="hidden w-full flex-col gap-0.5 sm:flex">
      {events.slice(0, 2).map((event) => (
        <div key={event.id} data-event-id={event.id} className="w-full">
          <EventBadge event={event} />
        </div>
      ))}
    </div>
  );
}
