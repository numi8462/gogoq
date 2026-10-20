import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  buildDemoWeekBoard,
  buildWeekBoard,
  DEMO_PARTICIPANT_COUNTS,
  type BoardEvent,
} from "@/lib/weekBoard";
import WeekBoardView from "./WeekBoardView";

// 3D 장면은 WebGL이 필요해 jsdom에서 돌 수 없으므로, 이 테스트는 그 위에 겹친
// HTML 층(요일 버튼, 일정 패널, 안내 문구)의 동작만 검증한다.
vi.mock("./WeekBoardSceneLazy", () => ({ default: () => null }));

const WED_NOON = new Date("2024-01-10T12:00:00");

function renderDemo() {
  return render(
    <WeekBoardView
      model={buildDemoWeekBoard(WED_NOON)}
      isDemo
      participantCounts={DEMO_PARTICIPANT_COUNTS}
      show3D={false}
    />,
  );
}

describe("WeekBoardView", () => {
  afterEach(() => {
    cleanup();
  });

  it("요일마다 버튼이 있고, 오늘 여부와 일정 수를 이름으로 읽어준다", () => {
    renderDemo();

    expect(screen.getByRole("button", { name: "예시 수요일, 오늘, 일정 없음" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "예시 금요일, 일정 1개" })).toBeInTheDocument();
    expect(
      screen.getByText("예시 화면이에요. 그룹을 만들고 일정을 잡으면 이번 주 모임이 이렇게 보여요."),
    ).toBeInTheDocument();
  });

  it("요일을 누르면 그날 일정이 열리고, Escape로 닫히면 포커스가 그 요일로 돌아간다", async () => {
    const user = userEvent.setup();
    renderDemo();
    const friday = screen.getByRole("button", { name: "예시 금요일, 일정 1개" });

    await user.click(friday);

    const panel = screen.getByRole("region", { name: "예시 금요일 일정" });
    expect(panel).toHaveTextContent("롤 내전");
    expect(panel).toHaveTextContent("20:00~22:00 · 3/5명");
    expect(friday).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("region", { name: "예시 금요일 일정" })).not.toBeInTheDocument();
    expect(friday).toHaveFocus();
    expect(friday).toHaveAttribute("aria-expanded", "false");
  });

  it("같은 요일을 다시 누르면 패널이 닫힌다", async () => {
    const user = userEvent.setup();
    renderDemo();
    const friday = screen.getByRole("button", { name: "예시 금요일, 일정 1개" });

    await user.click(friday);
    await user.click(friday);

    expect(screen.queryByRole("region", { name: "예시 금요일 일정" })).not.toBeInTheDocument();
  });

  it("마감된 일정은 마감으로 표시한다", async () => {
    const user = userEvent.setup();
    renderDemo();

    await user.click(screen.getByRole("button", { name: "예시 토요일, 일정 1개" }));

    const panel = screen.getByRole("region", { name: "예시 토요일 일정" });
    expect(panel).toHaveTextContent("발로란트");
    expect(panel).toHaveTextContent("5/5명");
    expect(panel).toHaveTextContent("마감");
  });

  it("실제 일정은 방으로 가는 링크로 보여주고, 참여자가 없으면 0명으로 표시한다", async () => {
    const user = userEvent.setup();
    const event: BoardEvent = {
      id: "e1",
      groupId: "g1",
      groupName: "롤 친구들",
      title: "롤 내전",
      start: new Date("2024-01-12T20:00:00"),
      end: new Date("2024-01-12T22:00:00"),
      maxParticipants: 5,
      isClosed: false,
      color: "blue",
    };
    render(
      <WeekBoardView
        model={buildWeekBoard([event], WED_NOON)}
        isDemo={false}
        participantCounts={{}}
        show3D={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "1월 12일 금요일, 일정 1개" }));

    const link = screen.getByRole("link", { name: /롤 내전/ });
    expect(link).toHaveAttribute("href", "/group/g1");
    expect(link).toHaveTextContent("롤 친구들 · 20:00~22:00 · 0/5명");
    expect(screen.getByText("다음 모임 · 금요일 20:00 · 롤 내전")).toBeInTheDocument();
  });

  it("참여 인원을 아직 모르면 정원만 보여준다", async () => {
    const user = userEvent.setup();
    render(
      <WeekBoardView
        model={buildDemoWeekBoard(WED_NOON)}
        isDemo
        participantCounts={null}
        show3D={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "예시 금요일, 일정 1개" }));

    expect(screen.getByRole("region", { name: "예시 금요일 일정" })).toHaveTextContent("최대 5명");
  });

  it("불러오는 중에는 요일 버튼 없이 안내만 보여준다", () => {
    render(
      <WeekBoardView
        model={null}
        isDemo={false}
        participantCounts={null}
        show3D={false}
      />,
    );

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByText("이번 주 모임을 불러오는 중이에요")).toBeInTheDocument();
  });
});
