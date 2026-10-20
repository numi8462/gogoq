import { addDays, isSameDay, startOfDay, startOfWeek } from "date-fns";
import type { Event, EventColor } from "@/types";

// 홈 첫 로딩에 date-fns의 format과 한국어 로케일(원본 약 39KB)을 싣지 않으려고,
// 보드에 필요한 "HH:mm", "M월 d일", 요일 표기는 아래 작은 함수로 직접 만든다.
const WEEKDAY_BY_GETDAY = ["일", "월", "화", "수", "목", "금", "토"] as const;
const pad2 = (n: number) => String(n).padStart(2, "0");

export const formatTime = (date: Date) => `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
export const formatMonthDay = (date: Date) => `${date.getMonth() + 1}월 ${date.getDate()}일`;
export const weekdayOf = (date: Date) => WEEKDAY_BY_GETDAY[date.getDay()];

// 홈 "징검다리 보드"의 상태 계산. 3D 장면과 HTML 층이 모두 이 결과만 보고 그린다.
// 보드는 저장되는 데이터가 아니라, 일정 목록과 현재 시각으로부터 매번 다시 계산된다.

export const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

export type BoardEvent = {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  start: Date;
  end: Date;
  maxParticipants: number;
  isClosed: boolean;
  color: EventColor;
};

export type BoardDay = {
  date: Date;
  weekday: (typeof WEEKDAY_LABELS)[number];
  isToday: boolean;
  isPast: boolean;
  events: BoardEvent[];
};

export type WeekBoardModel = {
  days: BoardDay[];
  todayIndex: number;
  /** 말이 이동해서 멈출 칸. 이번 주 안에 남은(진행 중 포함) 일정이 없으면 null */
  targetIndex: number | null;
  /** 지금 이후 가장 가까운 일정. 이번 주 밖일 수도 있다. */
  nextEvent: BoardEvent | null;
};

/** 3D 장면이 쓰는 색. CSS 테마 토큰(tile-default 등)에서 읽어온다. */
export type ScenePalette = {
  stone: string;
  scheduled: string;
  today: string;
  piece: string;
  /** 다크/라이트 판별과 바닥 반사광에 쓰는 배경색 */
  bg: string;
};

/** 앱 전체에서 주의 시작은 월요일 (resolveRelativeDate와 동일한 기준) */
export function getWeekStart(now: Date): Date {
  return startOfWeek(now, { weekStartsOn: 1 });
}

export function toBoardEvent(
  event: Event,
  groupNameById: Map<string, string>,
): BoardEvent {
  return {
    id: event.id,
    groupId: event.group_id,
    groupName: groupNameById.get(event.group_id) ?? "이름 없는 그룹",
    title: event.title,
    start: new Date(event.start_time),
    end: new Date(event.end_time),
    maxParticipants: event.max_participants,
    isClosed: event.status === "closed",
    color: event.color ?? "blue",
  };
}

export function buildWeekBoard(events: BoardEvent[], now: Date): WeekBoardModel {
  const weekStart = getWeekStart(now);
  const today = startOfDay(now);
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

  const days: BoardDay[] = WEEKDAY_LABELS.map((weekday, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      weekday,
      isToday: isSameDay(date, now),
      isPast: date < today,
      events: sorted.filter((e) => isSameDay(e.start, date)),
    };
  });

  const todayIndex = days.findIndex((d) => d.isToday);
  // 아직 끝나지 않은 일정 중 가장 빠른 것. 지금 진행 중인 모임도 "다음 모임"으로 본다.
  const nextEvent = sorted.find((e) => e.end > now) ?? null;
  const nextIndex = nextEvent
    ? days.findIndex((d) => isSameDay(d.date, nextEvent.start))
    : -1;

  return {
    days,
    todayIndex,
    // 어제 시작해 아직 진행 중인 일정이면 말은 뒤로 가지 않고 오늘 칸에 머문다.
    targetIndex: nextIndex >= 0 ? Math.max(nextIndex, todayIndex) : null,
    nextEvent,
  };
}

/**
 * 게스트처럼 보여줄 내 일정이 없는 사용자를 위한 예시 보드.
 * 실제 날짜의 가짜 일정으로 오해하지 않도록, 이번 주 수요일을 "오늘"로 가정한
 * 고정 시나리오를 쓰고 화면에는 날짜 숫자 없이 "예시"로 표시한다.
 */
export function buildDemoWeekBoard(now: Date): WeekBoardModel {
  const weekStart = getWeekStart(now);
  const at = (dayOffset: number, hour: number) => {
    const d = addDays(weekStart, dayOffset);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const demo = (
    id: string,
    dayOffset: number,
    hour: number,
    title: string,
    color: EventColor,
    isClosed = false,
  ): BoardEvent => ({
    id,
    groupId: "demo",
    groupName: "예시 그룹",
    title,
    start: at(dayOffset, hour),
    end: at(dayOffset, hour + 2),
    maxParticipants: 5,
    isClosed,
    color,
  });

  return buildWeekBoard(
    [
      demo("demo-1", 1, 19, "보드게임 모임", "green"),
      demo("demo-2", 4, 20, "롤 내전", "blue"),
      demo("demo-3", 5, 21, "발로란트", "purple", true),
    ],
    at(2, 12),
  );
}

export const DEMO_PARTICIPANT_COUNTS: Record<string, number> = {
  "demo-1": 4,
  "demo-2": 3,
  "demo-3": 5,
};

export function formatEventTime(event: BoardEvent): string {
  return `${formatTime(event.start)}~${formatTime(event.end)}`;
}

/**
 * 보드 아래 한 줄 안내 문구.
 * emptyHint는 일정이 하나도 없을 때 다음 행동을 알려주는 문장. 홈과 그룹 페이지에서 할 수 있는 일이 달라 바꿔 쓴다.
 */
export function getBoardCaption(
  model: WeekBoardModel,
  isDemo: boolean,
  emptyHint = "방에서 일정을 잡아보세요.",
): string {
  if (isDemo) {
    return "예시 화면이에요. 그룹을 만들고 일정을 잡으면 이번 주 모임이 이렇게 보여요.";
  }

  const next = model.nextEvent;
  if (!next) return `이번 주는 비어있어요. ${emptyHint}`;

  const time = formatTime(next.start);
  if (model.targetIndex === null) {
    const when = `${formatMonthDay(next.start)} (${weekdayOf(next.start)})`;
    return `이번 주는 비어있어요 · 다음 모임 ${when} ${time} · ${next.title}`;
  }

  const day = model.days[model.targetIndex];
  const when = day.isToday ? "오늘" : `${day.weekday}요일`;
  return `다음 모임 · ${when} ${time} · ${next.title}`;
}
