import { describe, expect, it } from "vitest";
import type { Event } from "@/types";
import {
  buildMonthWeeks,
  dayAriaLabel,
  describeNextMeeting,
  findNextEvent,
  getPawnRoute,
  moveFocusDate,
  summarizeFlags,
  toDayKey,
} from "./monthBoard";

// 2026-10-20은 화요일. 10월 달력은 9/27(일) ~ 10/31(토) 5주로 그려진다.
const TUE_NOON = new Date("2026-10-20T12:00:00");
const OCTOBER = buildMonthWeeks(new Date("2026-10-01T00:00:00"));

const ev = (
  id: string,
  start: string,
  end: string,
  status: Event["status"] = "open",
): Event => ({
  id,
  group_id: "g1",
  title: id,
  start_time: start,
  end_time: end,
  max_participants: 5,
  status,
});

describe("buildMonthWeeks", () => {
  it("그 달을 다 덮도록 일요일부터 시작하는 주들로 채운다", () => {
    expect(OCTOBER).toHaveLength(5);
    expect(toDayKey(OCTOBER[0][0])).toBe("2026-09-27");
    expect(toDayKey(OCTOBER[4][6])).toBe("2026-10-31");
    expect(OCTOBER.every((week) => week[0].getDay() === 0 && week.length === 7)).toBe(true);
  });

  it("마지막 날이 일요일이라 넘치는 달은 6주가 된다", () => {
    const may = buildMonthWeeks(new Date("2026-05-01T00:00:00"));
    expect(may).toHaveLength(6);
    expect(toDayKey(may[5][6])).toBe("2026-06-06");
  });
});

describe("findNextEvent", () => {
  it("취소됐거나 이미 끝난 일정은 건너뛰고, 진행 중인 일정은 다음 모임으로 본다", () => {
    const next = findNextEvent(
      [
        ev("ended", "2026-10-20T08:00:00", "2026-10-20T10:00:00"),
        ev("cancelled", "2026-10-20T13:00:00", "2026-10-20T15:00:00", "cancelled"),
        ev("later", "2026-10-22T20:00:00", "2026-10-22T22:00:00"),
        ev("ongoing", "2026-10-20T11:00:00", "2026-10-20T13:00:00"),
      ],
      TUE_NOON,
    );
    expect(next?.id).toBe("ongoing");
  });

  it("남은 일정이 없으면 null", () => {
    expect(findNextEvent([], TUE_NOON)).toBeNull();
  });
});

describe("getPawnRoute", () => {
  it("다음 모임이 같은 주면 하루씩 건너간다", () => {
    const route = getPawnRoute(
      OCTOBER,
      TUE_NOON,
      ev("thu", "2026-10-22T20:00:00", "2026-10-22T22:00:00"),
    );
    expect(route).toEqual({ path: ["2026-10-20", "2026-10-21", "2026-10-22"], jump: false });
  });

  it("다음 모임이 다른 주면 한 번에 뛴다", () => {
    const route = getPawnRoute(
      OCTOBER,
      TUE_NOON,
      ev("next-wed", "2026-10-28T20:00:00", "2026-10-28T22:00:00"),
    );
    expect(route).toEqual({ path: ["2026-10-20", "2026-10-28"], jump: true });
  });

  it("다음 모임이 화면 밖 다른 달이거나 없으면 오늘 칸에 머문다", () => {
    const stay = { path: ["2026-10-20"], jump: false };
    expect(
      getPawnRoute(OCTOBER, TUE_NOON, ev("nov", "2026-11-03T20:00:00", "2026-11-03T22:00:00")),
    ).toEqual(stay);
    expect(getPawnRoute(OCTOBER, TUE_NOON, null)).toEqual(stay);
  });

  it("어제 시작해 아직 진행 중인 모임이면 뒤로 가지 않고 오늘 칸에 머문다", () => {
    const route = getPawnRoute(
      OCTOBER,
      TUE_NOON,
      ev("overnight", "2026-10-19T22:00:00", "2026-10-20T14:00:00"),
    );
    expect(route).toEqual({ path: ["2026-10-20"], jump: false });
  });

  it("오늘이 없는 달을 보고 있으면 말을 그리지 않는다", () => {
    const november = buildMonthWeeks(new Date("2026-11-01T00:00:00"));
    expect(getPawnRoute(november, TUE_NOON, null)).toBeNull();
  });
});

describe("moveFocusDate", () => {
  const key = (from: string, k: string) => {
    const moved = moveFocusDate(new Date(from), k);
    return moved ? toDayKey(moved) : null;
  };

  it("방향키는 하루, 위아래는 일주일씩 옮기고 달 경계도 넘는다", () => {
    expect(key("2026-10-31T00:00:00", "ArrowRight")).toBe("2026-11-01");
    expect(key("2026-10-01T00:00:00", "ArrowLeft")).toBe("2026-09-30");
    expect(key("2026-10-20T00:00:00", "ArrowUp")).toBe("2026-10-13");
    expect(key("2026-10-20T00:00:00", "ArrowDown")).toBe("2026-10-27");
  });

  it("Home/End는 그 주의 처음(일)과 끝(토)으로 간다", () => {
    expect(key("2026-10-22T00:00:00", "Home")).toBe("2026-10-18");
    expect(key("2026-10-22T00:00:00", "End")).toBe("2026-10-24");
  });

  it("PageUp/PageDown은 한 달씩 옮기고, 없는 날짜는 그 달 마지막 날로 맞춘다", () => {
    expect(key("2026-01-31T00:00:00", "PageDown")).toBe("2026-02-28");
    expect(key("2026-10-20T00:00:00", "PageUp")).toBe("2026-09-20");
  });

  it("다른 키는 무시한다", () => {
    expect(key("2026-10-20T00:00:00", "a")).toBeNull();
  });
});

describe("summarizeFlags", () => {
  it("3개까지는 일정마다 깃발을 하나씩 그린다", () => {
    expect(summarizeFlags(0)).toEqual({ shown: 0, extra: 0 });
    expect(summarizeFlags(3)).toEqual({ shown: 3, extra: 0 });
  });

  it("넘으면 깃발 2개 뒤에 나머지 수를 붙인다", () => {
    expect(summarizeFlags(4)).toEqual({ shown: 2, extra: 2 });
    expect(summarizeFlags(9)).toEqual({ shown: 2, extra: 7 });
  });
});

describe("dayAriaLabel / describeNextMeeting", () => {
  it("날짜, 오늘 여부, 일정 제목을 한 문장으로 읽어준다", () => {
    expect(dayAriaLabel(TUE_NOON, true, [])).toBe("2026년 10월 20일 화요일, 오늘, 일정 없음");
    expect(dayAriaLabel(new Date("2026-10-22T00:00:00"), false, ["롤 내전", "발로란트"])).toBe(
      "2026년 10월 22일 목요일, 일정 2개: 롤 내전, 발로란트",
    );
  });

  it("다음 모임을 날짜와 시간으로 알려주고, 오늘이면 '오늘'로 쓴다", () => {
    expect(
      describeNextMeeting(ev("롤 내전", "2026-10-22T20:00:00", "2026-10-22T22:00:00"), TUE_NOON),
    ).toBe("다음 모임 · 10월 22일 (목) 20:00 · 롤 내전");
    expect(
      describeNextMeeting(ev("발로란트", "2026-10-20T21:00:00", "2026-10-20T23:00:00"), TUE_NOON),
    ).toBe("다음 모임 · 오늘 21:00 · 발로란트");
    expect(describeNextMeeting(null, TUE_NOON)).toBe(
      "다가오는 모임이 없어요. 날짜를 눌러 일정을 잡아보세요.",
    );
  });
});
