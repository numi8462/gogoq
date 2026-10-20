import { afterEach, beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Event } from "@/types";
import GroupWeekBoard from "./GroupWeekBoard";

// 3D 장면은 jsdom에서 돌 수 없으므로 빼고, 보드의 HTML 층으로 그룹 페이지 연동만 검증한다.
vi.mock("@/components/board/WeekBoardSceneLazy", () => ({ default: () => null }));
vi.mock("@/hooks/useWebGLAfterFirstPaint", () => ({ useWebGLAfterFirstPaint: () => false }));

const event = (id: string, start: string, status: Event["status"] = "open"): Event => ({
  id,
  group_id: "g1",
  title: id,
  start_time: start,
  end_time: start.replace(/T(\d{2})/, (_, h: string) => `T${String(Number(h) + 2).padStart(2, "0")}`),
  max_participants: 5,
  status,
});

describe("GroupWeekBoard", () => {
  beforeAll(() => {
    // 보드는 마운트 시점의 "오늘"을 기준으로 이번 주를 그린다. 2024-01-10(수)로 고정한다.
    vi.useFakeTimers({ now: new Date("2024-01-10T12:00:00"), toFake: ["Date"] });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    cleanup();
  });

  it("이 그룹의 이번 주 일정을 보여주고, 취소된 일정은 빼고 센다", () => {
    render(
      <GroupWeekBoard
        groupId="g1"
        groupName="롤 친구들"
        events={[
          event("롤 내전", "2024-01-12T20:00:00"),
          event("취소된 모임", "2024-01-12T18:00:00", "cancelled"),
        ]}
        selectedDate={null}
        onDateSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "1월 12일 금요일, 일정 1개" })).toBeInTheDocument();
    expect(screen.getByText("다음 모임 · 금요일 20:00 · 롤 내전")).toBeInTheDocument();
  });

  it("돌을 누르면 그 날짜를 캘린더/일정 목록 쪽으로 넘긴다", async () => {
    const user = userEvent.setup();
    const onDateSelect = vi.fn();
    render(
      <GroupWeekBoard
        groupId="g1"
        groupName="롤 친구들"
        events={[event("롤 내전", "2024-01-12T20:00:00")]}
        selectedDate={null}
        onDateSelect={onDateSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: "1월 12일 금요일, 일정 1개" }));

    const picked: Date = onDateSelect.mock.calls[0][0];
    expect(picked.getFullYear()).toBe(2024);
    expect(picked.getMonth()).toBe(0);
    expect(picked.getDate()).toBe(12);
  });

  it("캘린더에서 고른 날짜가 이번 주면 그 돌을 선택된 상태로 표시하고, 다른 주면 아무 돌도 선택하지 않는다", () => {
    const { rerender } = render(
      <GroupWeekBoard
        groupId="g1"
        groupName="롤 친구들"
        events={[]}
        selectedDate={new Date("2024-01-09T00:00:00")}
        onDateSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "1월 9일 화요일, 일정 없음" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    rerender(
      <GroupWeekBoard
        groupId="g1"
        groupName="롤 친구들"
        events={[]}
        selectedDate={new Date("2024-02-01T00:00:00")}
        onDateSelect={vi.fn()}
      />,
    );

    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAttribute("aria-pressed", "false");
    }
  });
});
