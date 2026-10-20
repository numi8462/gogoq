"use client";

import { useMemo, useState } from "react";
import type { Group } from "@/types";
import {
  buildDemoWeekBoard,
  buildWeekBoard,
  DEMO_PARTICIPANT_COUNTS,
  getWeekStart,
  toBoardEvent,
  type WeekBoardModel,
} from "@/lib/weekBoard";
import { useParticipantCounts, useWeekBoardEvents } from "@/hooks/useWeekBoard";
import { useWebGLAfterFirstPaint } from "@/hooks/useWebGLAfterFirstPaint";
import WeekBoardView from "@/components/board/WeekBoardView";

type Props = {
  /**
   * loading: 로그인 상태나 내 방 목록을 아직 모름
   * demo: 보여줄 내 방이 없음(게스트 포함) → 예시 보드
   * live: 내 방들의 이번 주 일정
   */
  mode: "loading" | "demo" | "live";
  groups: Group[];
};

const NO_IDS: string[] = [];

/** 홈 화면의 징검다리 보드. 내 방들의 이번 주 일정을 모아서 보여주고, 돌을 누르면 그날 일정이 열린다. */
export default function HomeWeekBoard({ mode, groups }: Props) {
  const [now] = useState(() => new Date());
  const weekStart = useMemo(() => getWeekStart(now), [now]);

  const groupIds = useMemo(() => groups.map((g) => g.id).sort(), [groups]);
  const groupNameById = useMemo(
    () => new Map(groups.map((g) => [g.id, g.name || "이름 없는 그룹"])),
    [groups],
  );

  const eventsQuery = useWeekBoardEvents(mode === "live" ? groupIds : NO_IDS, weekStart);
  const liveEvents = eventsQuery.data;

  const liveModel = useMemo(
    () =>
      liveEvents
        ? buildWeekBoard(
            liveEvents.map((e) => toBoardEvent(e, groupNameById)),
            now,
          )
        : null,
    [liveEvents, groupNameById, now],
  );
  const demoModel = useMemo(() => buildDemoWeekBoard(now), [now]);
  const emptyModel = useMemo(() => buildWeekBoard([], now), [now]);

  const weekEventIds = useMemo(
    () =>
      liveModel
        ? liveModel.days.flatMap((d) => d.events.map((e) => e.id)).sort()
        : NO_IDS,
    [liveModel],
  );
  const countsQuery = useParticipantCounts(mode === "live" ? weekEventIds : NO_IDS);

  const show3D = useWebGLAfterFirstPaint();

  let model: WeekBoardModel | null = null;
  let captionOverride: string | undefined;
  if (mode === "demo") {
    model = demoModel;
  } else if (mode === "live") {
    if (liveModel) {
      model = liveModel;
    } else if (eventsQuery.isError) {
      model = emptyModel;
      captionOverride = "일정을 불러오지 못했어요. 잠시 후 다시 시도해주세요.";
    }
  }

  const participantCounts =
    mode === "demo" ? DEMO_PARTICIPANT_COUNTS : (countsQuery.data ?? null);

  return (
    <WeekBoardView
      model={model}
      isDemo={mode === "demo"}
      participantCounts={participantCounts}
      show3D={show3D}
      captionOverride={captionOverride}
    />
  );
}
