"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { addMonths, isBefore, isSameDay, isSameMonth, startOfDay, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Event } from "@/types";
import { cn, prefersReducedMotion } from "@/lib/utils";
import {
  buildMonthWeeks,
  dayAriaLabel,
  describeNextMeeting,
  findNextEvent,
  getPawnRoute,
  monthTitle,
  moveFocusDate,
  toDayKey,
} from "@/lib/monthBoard";
import CalendarTile from "./CalendarTile";
import EventFlags from "./EventFlags";
import CalendarPawn from "./CalendarPawn";

type Props = {
  events: Event[];
  /** 선택 날짜는 그룹 페이지가 관리한다. 일정 목록(EventSidebar)과 같은 값을 본다. */
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 새 일정이 실시간으로 들어왔을 때 그 칸의 배지가 위에서 꽂히듯 나타나는 효과
const PLANT_KEYFRAMES: Keyframe[] = [
  { transform: "translateY(-10px) scale(0.6)", opacity: 0 },
  { transform: "translateY(0) scale(1.08)", opacity: 1, offset: 0.7 },
  { transform: "translateY(0) scale(1)", opacity: 1 },
];

const escapeSelector = (value: string) =>
  typeof CSS !== "undefined" && typeof CSS.escape === "function" ? CSS.escape(value) : value;

/**
 * 그룹 캘린더. 날짜 칸을 보드게임 판의 돌처럼 보여주고, 말이 오늘 칸에서 다음 모임 칸으로 이동한다.
 * 키보드 조작은 날짜 그리드 표준 동작을 따른다(방향키, Home/End, PageUp/PageDown, Enter).
 */
export default function CalendarView({ events, selectedDate, onDateSelect }: Props) {
  const [now] = useState(() => new Date());
  const [month, setMonth] = useState(() => startOfMonth(selectedDate ?? now));
  const [focusDate, setFocusDate] = useState<Date>(() => selectedDate ?? now);
  const titleId = useId();

  const gridRef = useRef<HTMLDivElement>(null);
  const cellsRef = useRef(new Map<string, HTMLElement>());
  const focusRequested = useRef(false);
  const knownEventIds = useRef<Set<string> | null>(null);

  const weeks = useMemo(() => buildMonthWeeks(month), [month]);
  const activeEvents = useMemo(() => events.filter((e) => e.status !== "cancelled"), [events]);
  const eventsByDay = useMemo(() => {
    const byDay = new Map<string, Event[]>();
    const sorted = [...activeEvents].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
    for (const event of sorted) {
      const key = toDayKey(new Date(event.start_time));
      byDay.set(key, [...(byDay.get(key) ?? []), event]);
    }
    return byDay;
  }, [activeEvents]);
  const nextEvent = useMemo(() => findNextEvent(activeEvents, now), [activeEvents, now]);
  const route = getPawnRoute(weeks, now, nextEvent);

  // Tab으로 들어왔을 때 포커스 받을 칸: 지금 보는 달에 있는 포커스 날짜, 없으면 1일
  const focusKey = toDayKey(focusDate);
  const tabbableKey = isSameMonth(focusDate, month) ? focusKey : toDayKey(month);

  // 키보드로 옮긴 날짜 칸에 실제 포커스를 준다. 달이 바뀌면 칸이 새로 그려진 뒤에 준다.
  useEffect(() => {
    if (!focusRequested.current) return;
    focusRequested.current = false;
    cellsRef.current.get(focusKey)?.focus();
  }, [focusKey, month]);

  // 실시간으로 새 일정이 들어오면 그 칸의 배지를 꽂히듯 보여준다. 첫 로딩 때는 하지 않는다.
  useLayoutEffect(() => {
    const ids = new Set(activeEvents.map((e) => e.id));
    const known = knownEventIds.current;
    knownEventIds.current = ids;
    const grid = gridRef.current;
    if (!known || !grid || prefersReducedMotion()) return;
    for (const id of ids) {
      if (known.has(id)) continue;
      grid
        .querySelectorAll<Element>(`[data-event-id="${escapeSelector(id)}"]`)
        .forEach((el) =>
          el.animate?.(PLANT_KEYFRAMES, {
            duration: 480,
            easing: "cubic-bezier(0.2, 0.9, 0.3, 1.3)",
          }),
        );
    }
  }, [activeEvents]);

  const select = (date: Date) => {
    setFocusDate(date);
    if (!isSameMonth(date, month)) setMonth(startOfMonth(date));
    onDateSelect(date);
  };

  const onCellKeyDown = (e: KeyboardEvent<HTMLDivElement>, date: Date) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(date);
      return;
    }
    const next = moveFocusDate(date, e.key);
    if (!next) return;
    e.preventDefault();
    focusRequested.current = true;
    setFocusDate(next);
    if (!isSameMonth(next, month)) setMonth(startOfMonth(next));
  };

  const goToToday = () => {
    setMonth(startOfMonth(now));
    setFocusDate(now);
  };

  const navButton =
    "p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, -1))}
          aria-label="이전 달"
          className={navButton}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <h2 id={titleId} className="text-lg font-bold tracking-[-0.02em] text-text-primary tabular-nums sm:text-xl">
            {monthTitle(month)}
          </h2>
          {!isSameMonth(month, now) && (
            <button
              type="button"
              onClick={goToToday}
              className="text-xs font-medium rounded-full px-2.5 py-1 border border-(--border) text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors active:scale-[0.96]"
            >
              오늘
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          aria-label="다음 달"
          className={navButton}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <p className="mt-1 mb-3 text-center text-xs text-text-secondary">
        {describeNextMeeting(nextEvent, now)}
      </p>

      <div
        aria-hidden
        className="mb-1.5 grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-text-secondary sm:gap-2"
      >
        {WEEKDAYS.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-labelledby={titleId}
        className="relative flex flex-col gap-1.5 sm:gap-2"
      >
        {weeks.map((week) => (
          <div key={toDayKey(week[0])} role="row" className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {week.map((date) => {
              const key = toDayKey(date);
              const inMonth = isSameMonth(date, month);
              const isToday = isSameDay(date, now);
              const isPast = isBefore(date, startOfDay(now));
              const isSelected = !!selectedDate && isSameDay(date, selectedDate);
              const dayEvents = eventsByDay.get(key) ?? [];

              return (
                <div
                  key={key}
                  ref={(el) => {
                    if (!el) return;
                    cellsRef.current.set(key, el);
                    return () => {
                      cellsRef.current.delete(key);
                    };
                  }}
                  role="gridcell"
                  data-day={key}
                  tabIndex={key === tabbableKey ? 0 : -1}
                  aria-selected={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={dayAriaLabel(
                    date,
                    isToday,
                    dayEvents.map((e) => e.title),
                  )}
                  onClick={() => select(date)}
                  onKeyDown={(e) => onCellKeyDown(e, date)}
                  className={cn(
                    // 보드 타일: 아래쪽에 테두리색 두께(--edge)를 줘서 판 위에 놓인 타일처럼 보이게 한다.
                    // 올리면 살짝 뜨고, 누르면 눌리고, 선택하면 높이 떠오른다.
                    "relative h-16 cursor-pointer select-none rounded-xl border p-1 outline-none sm:h-28 sm:rounded-2xl sm:p-1.5",
                    "transition-[transform,box-shadow] duration-150",
                    "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                    dayEvents.length > 0
                      ? "border-cell-scheduled-edge bg-cell-scheduled [--edge:var(--color-cell-scheduled-edge)]"
                      : "border-cell-edge bg-cell [--edge:var(--color-cell-edge)]",
                    isSelected
                      ? "-translate-y-1 shadow-[0_7px_0_var(--edge)] ring-2 ring-accent"
                      : "shadow-[0_3px_0_var(--edge)] hover:-translate-y-0.5 hover:shadow-[0_5px_0_var(--edge)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--edge)]",
                    isToday && !isSelected && "ring-2 ring-accent-secondary",
                    isPast && inMonth && "opacity-60",
                    !inMonth && "opacity-35 shadow-none",
                  )}
                >
                  {/* 날짜 숫자와 깃발. 오른쪽 위는 말이 설 자리라 비워둔다. 칸이 좁은 모바일에서는 깃발이 다음 줄로 내려간다. */}
                  <div
                    aria-hidden
                    className="flex flex-wrap items-center gap-x-1 gap-y-0.5 pr-5 sm:pr-7"
                  >
                    <span
                      className={cn(
                        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-medium tabular-nums text-text-primary sm:text-xs",
                        isToday && "bg-accent-secondary text-neutral-900",
                      )}
                    >
                      {date.getDate()}
                    </span>
                    <EventFlags events={dayEvents} />
                  </div>
                  <div aria-hidden className="mt-1">
                    <CalendarTile events={dayEvents} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {route && <CalendarPawn path={route.path.join(",")} jump={route.jump} />}
      </div>
    </div>
  );
}
