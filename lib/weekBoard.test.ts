import { describe, expect, it } from "vitest";
import type { Event } from "@/types";
import {
  buildDemoWeekBoard,
  buildWeekBoard,
  describeWhen,
  getBoardCaption,
  nextEventByGroup,
  toBoardEvent,
  type BoardEvent,
} from "./weekBoard";

// 2024-01-08(월) ~ 2024-01-14(일) 주를 기준으로 한다. 2024-01-10은 수요일.
const WED_NOON = new Date("2024-01-10T12:00:00");

const ev = (
  id: string,
  start: string,
  end: string,
  extra: Partial<BoardEvent> = {},
): BoardEvent => ({
  id,
  groupId: "g1",
  groupName: "롤 친구들",
  title: id,
  start: new Date(start),
  end: new Date(end),
  maxParticipants: 5,
  isClosed: false,
  color: "blue",
  ...extra,
});

describe("buildWeekBoard", () => {
  it("월~일 7칸을 만들고 오늘 칸과 지난 날을 표시한다", () => {
    const board = buildWeekBoard([], WED_NOON);

    expect(board.days.map((d) => d.weekday)).toEqual(["월", "화", "수", "목", "금", "토", "일"]);
    expect(board.todayIndex).toBe(2);
    expect(board.days.map((d) => d.isPast)).toEqual([true, true, false, false, false, false, false]);
    expect(board.days.filter((d) => d.isToday)).toHaveLength(1);
  });

  it("일정을 시작 날짜의 칸에 시간순으로 넣는다", () => {
    const board = buildWeekBoard(
      [
        ev("fri-late", "2024-01-12T21:00:00", "2024-01-12T23:00:00"),
        ev("tue", "2024-01-09T19:00:00", "2024-01-09T21:00:00"),
        ev("fri-early", "2024-01-12T19:00:00", "2024-01-12T20:00:00"),
      ],
      WED_NOON,
    );

    expect(board.days[1].events.map((e) => e.id)).toEqual(["tue"]);
    expect(board.days[4].events.map((e) => e.id)).toEqual(["fri-early", "fri-late"]);
  });

  it("말은 지난 일정을 건너뛰고 가장 가까운 남은 일정의 칸으로 간다", () => {
    const board = buildWeekBoard(
      [
        ev("tue", "2024-01-09T19:00:00", "2024-01-09T21:00:00"),
        ev("sat", "2024-01-13T21:00:00", "2024-01-13T23:00:00"),
        ev("fri", "2024-01-12T20:00:00", "2024-01-12T22:00:00"),
      ],
      WED_NOON,
    );

    expect(board.targetIndex).toBe(4);
    expect(board.nextEvent?.id).toBe("fri");
  });

  it("오늘 이미 끝난 일정은 건너뛰고, 진행 중인 일정이면 오늘 칸에 멈춘다", () => {
    const events = [
      ev("wed", "2024-01-10T18:00:00", "2024-01-10T20:00:00"),
      ev("fri", "2024-01-12T20:00:00", "2024-01-12T22:00:00"),
    ];

    const afterWed = buildWeekBoard(events, new Date("2024-01-10T21:00:00"));
    expect(afterWed.targetIndex).toBe(4);

    const duringWed = buildWeekBoard(events, new Date("2024-01-10T19:00:00"));
    expect(duringWed.targetIndex).toBe(2);
    expect(duringWed.nextEvent?.id).toBe("wed");
  });

  it("어제 시작해 아직 진행 중인 일정이면 말은 뒤로 가지 않고 오늘 칸에 머문다", () => {
    const board = buildWeekBoard(
      [ev("overnight", "2024-01-09T23:00:00", "2024-01-10T02:00:00")],
      new Date("2024-01-10T01:00:00"),
    );

    expect(board.targetIndex).toBe(board.todayIndex);
  });

  it("이번 주에 남은 일정이 없으면 targetIndex는 null이고 다음 주 일정은 nextEvent로만 남는다", () => {
    const board = buildWeekBoard(
      [ev("next-mon", "2024-01-15T20:00:00", "2024-01-15T22:00:00")],
      WED_NOON,
    );

    expect(board.targetIndex).toBeNull();
    expect(board.nextEvent?.id).toBe("next-mon");
    expect(board.days.every((d) => d.events.length === 0)).toBe(true);
  });

  it("일요일에는 오늘이 마지막 칸이고, 다음 주 월요일 일정은 보드에 올라가지 않는다", () => {
    const board = buildWeekBoard(
      [ev("next-mon", "2024-01-15T20:00:00", "2024-01-15T22:00:00")],
      new Date("2024-01-14T15:00:00"),
    );

    expect(board.todayIndex).toBe(6);
    expect(board.targetIndex).toBeNull();
  });
});

describe("buildDemoWeekBoard", () => {
  it("수요일을 오늘로 가정하고, 말이 금요일 예시 일정으로 가는 고정 시나리오를 만든다", () => {
    const board = buildDemoWeekBoard(new Date("2024-01-14T15:00:00"));

    expect(board.todayIndex).toBe(2);
    expect(board.targetIndex).toBe(4);
    expect(board.days[4].events[0].title).toBe("롤 내전");
  });
});

describe("getBoardCaption", () => {
  it("이번 주 안의 다음 모임은 요일과 시간으로 알려준다", () => {
    const board = buildWeekBoard(
      [ev("롤 내전", "2024-01-12T20:00:00", "2024-01-12T22:00:00")],
      WED_NOON,
    );
    expect(getBoardCaption(board, false)).toBe("다음 모임 · 금요일 20:00 · 롤 내전");
  });

  it("다음 모임이 오늘이면 '오늘'로 알려준다", () => {
    const board = buildWeekBoard(
      [ev("발로란트", "2024-01-10T20:00:00", "2024-01-10T22:00:00")],
      WED_NOON,
    );
    expect(getBoardCaption(board, false)).toBe("다음 모임 · 오늘 20:00 · 발로란트");
  });

  it("이번 주가 비었으면 다음 주 이후 가장 가까운 일정을 날짜로 알려준다", () => {
    const board = buildWeekBoard(
      [ev("보드게임", "2024-01-15T20:00:00", "2024-01-15T22:00:00")],
      WED_NOON,
    );
    expect(getBoardCaption(board, false)).toBe(
      "이번 주는 비어있어요 · 다음 모임 1월 15일 (월) 20:00 · 보드게임",
    );
  });

  it("일정이 하나도 없으면 일정을 잡아보라고 안내한다", () => {
    expect(getBoardCaption(buildWeekBoard([], WED_NOON), false)).toBe(
      "이번 주는 비어있어요. 방에서 일정을 잡아보세요.",
    );
  });
});

describe("toBoardEvent", () => {
  it("DB 일정 레코드를 보드용으로 바꾸고, 마감 상태와 그룹 이름을 채운다", () => {
    const event: Event = {
      id: "e1",
      group_id: "g1",
      title: "롤 내전",
      start_time: "2024-01-12T20:00:00",
      end_time: "2024-01-12T22:00:00",
      max_participants: 5,
      status: "closed",
    };

    const result = toBoardEvent(event, new Map([["g1", "롤 친구들"]]));

    expect(result).toMatchObject({
      groupName: "롤 친구들",
      isClosed: true,
      color: "blue",
      maxParticipants: 5,
    });
    expect(toBoardEvent(event, new Map()).groupName).toBe("이름 없는 그룹");
  });
});

describe("describeWhen", () => {
  it("오늘과 내일은 그렇게 부른다", () => {
    expect(describeWhen(new Date("2024-01-10T20:00:00"), WED_NOON)).toBe("오늘 20:00");
    expect(describeWhen(new Date("2024-01-11T19:30:00"), WED_NOON)).toBe("내일 19:30");
  });

  it("이번 주 남은 날은 요일로 부른다", () => {
    expect(describeWhen(new Date("2024-01-13T21:00:00"), WED_NOON)).toBe("토요일 21:00");
  });

  it("다음 주 이후는 날짜와 요일로 부른다", () => {
    expect(describeWhen(new Date("2024-01-20T20:00:00"), WED_NOON)).toBe("1월 20일 (토) 20:00");
  });

  it("일요일 밤의 '내일'은 다음 주 월요일이다", () => {
    const sundayNight = new Date("2024-01-14T22:00:00");
    expect(describeWhen(new Date("2024-01-15T20:00:00"), sundayNight)).toBe("내일 20:00");
  });
});

describe("nextEventByGroup", () => {
  it("방마다 끝나지 않은 가장 빠른 일정 하나만 고른다", () => {
    const events = [
      ev("g1-later", "2024-01-12T20:00:00", "2024-01-12T22:00:00"),
      ev("g1-past", "2024-01-09T20:00:00", "2024-01-09T22:00:00"),
      ev("g1-soon", "2024-01-11T20:00:00", "2024-01-11T22:00:00"),
      ev("g2-only", "2024-01-13T20:00:00", "2024-01-13T22:00:00", { groupId: "g2" }),
    ];
    const map = nextEventByGroup(events, WED_NOON);
    expect(map.get("g1")?.id).toBe("g1-soon");
    expect(map.get("g2")?.id).toBe("g2-only");
  });

  it("진행 중인 일정도 다음 일정으로 본다", () => {
    const events = [ev("now", "2024-01-10T11:00:00", "2024-01-10T13:00:00")];
    expect(nextEventByGroup(events, WED_NOON).get("g1")?.id).toBe("now");
  });
});
