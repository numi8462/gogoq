import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach } from "vitest";
import ErrorBoundary from "./error";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("app/error.tsx (라우트 에러 바운더리)", () => {
  beforeEach(() => {
    push.mockClear();
    // 컴포넌트가 console.error(error)로 로그를 남기는 건 의도된 동작이라
    // 테스트 출력만 조용히 한다.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("'다시 시도'를 누르면 reset()을 호출한다", async () => {
    const reset = vi.fn();
    render(<ErrorBoundary error={new Error("boom")} reset={reset} />);

    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("'홈으로'를 누르면 /home으로 이동한다", async () => {
    render(<ErrorBoundary error={new Error("boom")} reset={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "홈으로" }));

    expect(push).toHaveBeenCalledWith("/home");
  });
});
