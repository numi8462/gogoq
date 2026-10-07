import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useRealtimeSync } from "./useRealtimeSync";
import { useToastStore } from "@/lib/store/useToastStore";

// Supabase Realtime 채널의 .channel().on().on().subscribe(cb) 체이닝을
// 그대로 흉내 내는 가짜 채널. subscribe에 넘겨준 콜백을 밖으로 꺼내서
// 테스트에서 직접 상태 변화(CHANNEL_ERROR 등)를 흘려보낸다.
//
// vi.mock(...)의 factory는 import보다도 앞으로 끌어올려져(hoisted) 실행되므로,
// factory가 참조하는 값은 평범한 top-level const가 아니라 vi.hoisted로 같은
// 위치에 끌어올려 선언해야 한다 (아니면 "Cannot access before initialization").
const { removeChannel, callbackHolder } = vi.hoisted(() => ({
  removeChannel: vi.fn(),
  callbackHolder: { current: undefined as ((status: string) => void) | undefined },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: vi.fn(() => {
      const channel = {
        on: vi.fn(() => channel),
        subscribe: vi.fn((cb: (status: string) => void) => {
          callbackHolder.current = cb;
          return channel;
        }),
      };
      return channel;
    }),
    removeChannel,
  }),
}));

function renderRealtimeSync(groupId: string) {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useRealtimeSync(groupId), { wrapper });
}

describe("useRealtimeSync - 연결 실패 알림", () => {
  beforeEach(() => {
    callbackHolder.current = undefined;
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    cleanup();
  });

  it("CHANNEL_ERROR 상태를 받으면 에러 토스트를 띄운다", () => {
    renderRealtimeSync("group-1");
    expect(callbackHolder.current).toBeDefined();

    act(() => {
      callbackHolder.current?.("CHANNEL_ERROR");
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({
      variant: "error",
      message: "실시간 동기화 연결에 문제가 생겼어요. 새로고침 해주세요.",
    });
  });

  it("TIMED_OUT도 동일하게 에러 토스트를 띄운다", () => {
    renderRealtimeSync("group-1");

    act(() => {
      callbackHolder.current?.("TIMED_OUT");
    });

    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it("SUBSCRIBED로 복구되기 전까지는 에러가 반복돼도 토스트를 한 번만 띄운다", () => {
    renderRealtimeSync("group-1");

    act(() => {
      callbackHolder.current?.("CHANNEL_ERROR");
      callbackHolder.current?.("TIMED_OUT");
      callbackHolder.current?.("CHANNEL_ERROR");
    });

    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it("SUBSCRIBED로 복구된 뒤 다시 에러가 나면 또 알려준다", () => {
    renderRealtimeSync("group-1");

    act(() => {
      callbackHolder.current?.("CHANNEL_ERROR");
      callbackHolder.current?.("SUBSCRIBED");
      callbackHolder.current?.("CHANNEL_ERROR");
    });

    expect(useToastStore.getState().toasts).toHaveLength(2);
  });

  it("정상 연결(SUBSCRIBED)만 받으면 토스트를 띄우지 않는다", () => {
    renderRealtimeSync("group-1");

    act(() => {
      callbackHolder.current?.("SUBSCRIBED");
    });

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
