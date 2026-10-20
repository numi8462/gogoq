import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Event } from "@/types";
import { formatMonthDay, formatTime, weekdayOf } from "@/lib/weekBoard";

// 그룹 페이지의 "보드형 캘린더" 상태 계산. 화면 코드와 분리해서 테스트한다.
// 그룹 캘린더는 기존 캘린더와 같이 일요일부터 시작한다.
const WEEK_STARTS_ON = 0;

const pad2 = (n: number) => String(n).padStart(2, "0");

/** 칸을 찾고 비교할 때 쓰는 하루 단위 키 (로컬 시간 기준 YYYY-MM-DD) */
export const toDayKey = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const monthTitle = (month: Date) => `${month.getFullYear()}년 ${month.getMonth() + 1}월`;

/** 그 달을 다 덮는 주 단위 칸들. 앞뒤 달의 날짜로 첫 주와 마지막 주를 채운다. */
export function buildMonthWeeks(month: Date): Date[][] {
  const first = startOfWeek(startOfMonth(month), { weekStartsOn: WEEK_STARTS_ON });
  const last = endOfWeek(endOfMonth(month), { weekStartsOn: WEEK_STARTS_ON });
  const weeks: Date[][] = [];
  for (let weekStart = first; weekStart <= last; weekStart = addDays(weekStart, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)));
  }
  return weeks;
}

/** 아직 끝나지 않은 일정 중 가장 먼저 시작하는 것. 지금 진행 중인 모임도 포함한다. */
export function findNextEvent(events: Event[], now: Date): Event | null {
  let next: Event | null = null;
  for (const e of events) {
    if (e.status === "cancelled") continue;
    if (new Date(e.end_time) <= now) continue;
    if (!next || new Date(e.start_time) < new Date(next.start_time)) next = e;
  }
  return next;
}

export type PawnRoute = {
  /** 말이 지나갈 칸들의 dayKey. 첫 칸이 오늘, 마지막 칸이 멈출 곳 */
  path: string[];
  /** true면 한 칸씩이 아니라 한 번에 크게 뛴다. 다음 모임이 다른 주에 있을 때 */
  jump: boolean;
};

/**
 * 말의 이동 경로. 오늘이 화면에 없는 달을 보고 있으면 말을 그리지 않는다(null).
 * - 다음 모임이 같은 주: 하루씩 건너간다.
 * - 다른 주: 줄을 바꿔 한 칸씩 가면 어색하고 오래 걸려서 한 번에 뛴다.
 * - 화면 밖(다른 달)이거나, 어제 시작해 진행 중이거나, 모임이 없으면 오늘 칸에 머문다.
 */
export function getPawnRoute(weeks: Date[][], now: Date, next: Event | null): PawnRoute | null {
  const todayKey = toDayKey(now);
  const rowOf = (key: string) => weeks.findIndex((week) => week.some((d) => toDayKey(d) === key));

  const todayRow = rowOf(todayKey);
  if (todayRow < 0) return null;

  const stay: PawnRoute = { path: [todayKey], jump: false };
  if (!next) return stay;

  const start = new Date(next.start_time);
  const targetKey = toDayKey(start);
  const targetRow = rowOf(targetKey);
  if (targetRow < 0 || start < startOfDay(now) || targetKey === todayKey) return stay;

  if (targetRow === todayRow) {
    const days = differenceInCalendarDays(start, now);
    return {
      path: Array.from({ length: days + 1 }, (_, i) => toDayKey(addDays(now, i))),
      jump: false,
    };
  }
  return { path: [todayKey, targetKey], jump: true };
}

/** 키보드로 날짜를 옮길 때 다음 날짜. 날짜 그리드의 표준 키 동작을 따른다. 해당 키가 아니면 null */
export function moveFocusDate(date: Date, key: string): Date | null {
  switch (key) {
    case "ArrowLeft":
      return addDays(date, -1);
    case "ArrowRight":
      return addDays(date, 1);
    case "ArrowUp":
      return addDays(date, -7);
    case "ArrowDown":
      return addDays(date, 7);
    case "Home":
      return startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
    case "End":
      return addDays(startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON }), 6);
    case "PageUp":
      return addMonths(date, -1);
    case "PageDown":
      return addMonths(date, 1);
    default:
      return null;
  }
}

/**
 * 날짜 옆 깃발을 몇 개 그릴지. max개까지는 일정마다 하나씩 그리고,
 * 넘으면 깃발 max-1개 뒤에 "+나머지 수"를 붙여 칸이 넘치지 않게 한다.
 */
export function summarizeFlags(count: number, max = 3) {
  if (count <= max) return { shown: count, extra: 0 };
  return { shown: max - 1, extra: count - (max - 1) };
}

/** 날짜 칸을 스크린리더가 읽을 이름 */
export function dayAriaLabel(date: Date, isToday: boolean, titles: string[]) {
  const parts = [
    `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${weekdayOf(date)}요일`,
  ];
  if (isToday) parts.push("오늘");
  parts.push(titles.length > 0 ? `일정 ${titles.length}개: ${titles.join(", ")}` : "일정 없음");
  return parts.join(", ");
}

/** 캘린더 위 한 줄 안내. 말이 어디로 가는지 글로도 알려준다. */
export function describeNextMeeting(next: Event | null, now: Date) {
  if (!next) return "다가오는 모임이 없어요. 날짜를 눌러 일정을 잡아보세요.";
  const start = new Date(next.start_time);
  const when = isSameDay(start, now) ? "오늘" : `${formatMonthDay(start)} (${weekdayOf(start)})`;
  return `다음 모임 · ${when} ${formatTime(start)} · ${next.title}`;
}
