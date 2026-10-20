import { Event } from "@/types";
import { cn, EVENT_COLOR_HEX } from "@/lib/utils";
import { summarizeFlags } from "@/lib/monthBoard";

/**
 * 날짜 옆에 일정마다 그 색의 깃발을 꽂아 하루에 몇 개 있는지 한눈에 보이게 한다.
 * 많으면 깃발 2개 뒤에 "+나머지 수"로 줄인다. 마감된 일정의 깃발은 흐리게 그린다.
 */
export default function EventFlags({ events }: { events: Event[] }) {
  if (events.length === 0) return null;
  const { shown, extra } = summarizeFlags(events.length);

  return (
    <span aria-hidden className="inline-flex items-end gap-px">
      {events.slice(0, shown).map((event) => (
        <svg
          key={event.id}
          // 새 일정이 들어왔을 때 캘린더가 이 표시로 해당 깃발을 찾아 꽂히는 애니메이션을 준다.
          data-event-id={event.id}
          viewBox="0 0 10 13"
          className={cn("h-3.5 w-[11px]", event.status === "closed" && "opacity-50")}
        >
          <rect x="1" y="0.5" width="1.3" height="12" rx="0.65" className="fill-text-secondary" />
          <path d="M2.3 1h6.7L7.1 3.6 9 6.2H2.3z" fill={EVENT_COLOR_HEX[event.color ?? "gray"]} />
        </svg>
      ))}
      {extra > 0 && (
        <span className="ml-0.5 text-[10px] font-semibold leading-none tabular-nums text-text-secondary">
          +{extra}
        </span>
      )}
    </span>
  );
}
