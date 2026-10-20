"use client";

import { useMemo, useState } from "react";
import { isSameDay } from "date-fns";
import type { Event } from "@/types";
import { buildWeekBoard, toBoardEvent } from "@/lib/weekBoard";
import { useWebGLAfterFirstPaint } from "@/hooks/useWebGLAfterFirstPaint";
import WeekBoardView from "@/components/board/WeekBoardView";

type Props = {
  groupId: string;
  groupName: string | null;
  /** 그룹 페이지가 이미 불러와 실시간으로 갱신하는 일정 목록 */
  events: Event[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
};

/**
 * 그룹 페이지의 징검다리 보드. 이 그룹의 이번 주 일정만 보여준다.
 * 홈과 달리 자체 일정 패널을 띄우지 않고, 돌을 누르면 그 날짜를 캘린더와 일정 목록에 바로 선택한다.
 * 일정 목록이 실시간으로 바뀌면 말도 새 "다음 모임"으로 다시 이동한다.
 */
export default function GroupWeekBoard({
  groupId,
  groupName,
  events,
  selectedDate,
  onDateSelect,
}: Props) {
  const [now] = useState(() => new Date());
  const show3D = useWebGLAfterFirstPaint();

  const model = useMemo(() => {
    const names = new Map([[groupId, groupName || "이 그룹"]]);
    return buildWeekBoard(
      events
        .filter((e) => e.status !== "cancelled")
        .map((e) => toBoardEvent(e, names)),
      now,
    );
  }, [events, groupId, groupName, now]);

  const selectedIndex = selectedDate
    ? model.days.findIndex((d) => isSameDay(d.date, selectedDate))
    : -1;

  return (
    <WeekBoardView
      model={model}
      isDemo={false}
      participantCounts={null}
      show3D={show3D}
      emptyHint="돌을 눌러 날짜를 고르고 일정을 추가해보세요."
      onDaySelect={(index) => onDateSelect(model.days[index].date)}
      selectedIndex={selectedIndex >= 0 ? selectedIndex : null}
    />
  );
}
