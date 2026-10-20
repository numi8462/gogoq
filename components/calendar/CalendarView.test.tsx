import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Event } from "@/types";
import { toDayKey } from "@/lib/monthBoard";
import CalendarView from "./CalendarView";

// 2026-10-20(화) 정오를 "지금"으로 고정한다. 날짜만 고정하고 타이머는 실제로 둔다.
beforeAll(() => {
  vi.useFakeTimers({ now: new Date("2026-10-20T12:00:00"), toFake: ["Date"] });
});

afterAll(() => {
  vi.useRealTimers();
});

afterEach(() => {
  cleanup();
});

const ev = (
  title: string,
  start: string,
  end: string,
  status: Event["status"] = "open",
): Event => ({
  id: title,
  group_id: "g1",
  title,
  start_time: start,
  end_time: end,
  max_participants: 5,
  status,
});

const EVENTS: Event[] = [
  ev("보드게임", "2026-10-19T19:00:00", "2026-10-19T21:00:00"),
  ev("롤 내전", "2026-10-22T20:00:00", "2026-10-22T22:00:00"),
  ev("취소된 모임", "2026-10-22T18:00:00", "2026-10-22T19:00:00", "cancelled"),
  ev("발로란트", "2026-10-23T21:00:00", "2026-10-23T23:00:00", "closed"),
];

function renderCalendar(selectedDate: Date | null = null) {
  const onDateSelect = vi.fn();
  const utils = render(
    <CalendarView events={EVENTS} selectedDate={selectedDate} onDateSelect={onDateSelect} />,
  );
  return { ...utils, onDateSelect };
}

const cell = (name: string) => screen.getByRole("gridcell", { name });

describe("CalendarView (보드형 그룹 캘린더)", () => {
  it("달 제목과 날짜 칸을 그리고, 말이 향하는 다음 모임을 글로도 알려준다", () => {
    renderCalendar();

    expect(screen.getByRole("heading", { name: "2026년 10월" })).toBeInTheDocument();
    expect(screen.getAllByRole("gridcell")).toHaveLength(35);
    expect(screen.getByText("다음 모임 · 10월 22일 (목) 20:00 · 롤 내전")).toBeInTheDocument();
  });

  it("칸 이름에 날짜, 오늘 여부, 일정 제목을 담고 취소된 일정은 뺀다", () => {
    renderCalendar();

    expect(cell("2026년 10월 20일 화요일, 오늘, 일정 없음")).toHaveAttribute(
      "aria-current",
      "date",
    );
    expect(cell("2026년 10월 22일 목요일, 일정 1개: 롤 내전")).toBeInTheDocument();
  });

  it("날짜 옆에 일정마다 깃발을 꽂고, 많으면 깃발 2개와 +나머지 수로 줄인다", () => {
    const busyDay = Array.from({ length: 5 }, (_, i) =>
      ev(`모임${i + 1}`, `2026-10-28T1${i}:00:00`, `2026-10-28T1${i}:30:00`),
    );
    render(<CalendarView events={[...EVENTS, ...busyDay]} selectedDate={null} onDateSelect={vi.fn()} />);

    const thursday = cell("2026년 10월 22일 목요일, 일정 1개: 롤 내전");
    expect(thursday.querySelectorAll("svg[data-event-id]")).toHaveLength(1);

    const busy = screen.getByRole("gridcell", { name: /2026년 10월 28일 수요일, 일정 5개/ });
    expect(busy.querySelectorAll("svg[data-event-id]")).toHaveLength(2);
    expect(busy).toHaveTextContent("+3");
  });

  it("Tab으로 들어올 칸은 하나뿐이고, 처음에는 오늘 칸이다", () => {
    renderCalendar();

    const tabbable = screen.getAllByRole("gridcell").filter((c) => c.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveAccessibleName("2026년 10월 20일 화요일, 오늘, 일정 없음");
  });

  it("칸을 누르면 그 날짜를 고르고, 선택된 칸은 aria-selected로 알린다", async () => {
    const user = userEvent.setup();
    const { onDateSelect, rerender } = renderCalendar();

    await user.click(cell("2026년 10월 22일 목요일, 일정 1개: 롤 내전"));
    expect(toDayKey(onDateSelect.mock.calls[0][0])).toBe("2026-10-22");

    rerender(
      <CalendarView
        events={EVENTS}
        selectedDate={new Date("2026-10-22T00:00:00")}
        onDateSelect={onDateSelect}
      />,
    );
    expect(cell("2026년 10월 22일 목요일, 일정 1개: 롤 내전")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("방향키로 날짜를 옮기고 Enter로 고른다", async () => {
    const user = userEvent.setup();
    const { onDateSelect } = renderCalendar();

    cell("2026년 10월 22일 목요일, 일정 1개: 롤 내전").focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveAccessibleName(
      "2026년 10월 23일 금요일, 일정 1개: 발로란트",
    );

    await user.keyboard("{Enter}");
    expect(toDayKey(onDateSelect.mock.calls[0][0])).toBe("2026-10-23");
  });

  it("방향키로 달 경계를 넘으면 다음 달로 바뀌고 포커스가 따라간다", async () => {
    const user = userEvent.setup();
    renderCalendar();

    cell("2026년 10월 29일 목요일, 일정 없음").focus();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("heading", { name: "2026년 11월" })).toBeInTheDocument();
    expect(document.activeElement).toHaveAccessibleName("2026년 11월 5일 목요일, 일정 없음");
  });

  it("다른 달로 가면 '오늘' 버튼이 나타나고, 누르면 이번 달로 돌아온다", async () => {
    const user = userEvent.setup();
    renderCalendar();
    expect(screen.queryByRole("button", { name: "오늘" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다음 달" }));
    expect(screen.getByRole("heading", { name: "2026년 11월" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "오늘" }));
    expect(screen.getByRole("heading", { name: "2026년 10월" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "오늘" })).not.toBeInTheDocument();
  });

  it("말은 화면 밖 초기 위치에 남지 않고 칸 위에 놓인다", () => {
    const { container } = renderCalendar();
    const pawn = container.querySelector<HTMLElement>("[data-pawn]");

    // 애니메이션을 못 쓰는 환경(jsdom)에서는 바로 도착 칸에 놓여야 한다.
    expect(pawn?.style.transform).toMatch(/^translate\(/);
    expect(pawn?.style.transform).not.toBe("translate(-9999px, -9999px)");
  });

  it("말은 오늘이 있는 달에서만 그린다", async () => {
    const user = userEvent.setup();
    const { container } = renderCalendar();
    expect(container.querySelector("[data-pawn]")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "다음 달" }));
    expect(container.querySelector("[data-pawn]")).toBeNull();
  });
});
