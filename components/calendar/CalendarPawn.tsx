"use client";

import { useLayoutEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/utils";
import { hopKeyframes, type Point } from "@/lib/pawnHop";
import PawnIcon from "@/components/board/PawnIcon";

type Props = {
  /**
   * 말이 지나갈 칸들의 dayKey를 쉼표로 이은 값. 첫 칸이 오늘, 마지막 칸이 멈출 곳.
   * 문자열로 받아서, 실시간 갱신으로 일정 배열만 새로 만들어지고 경로가 같으면 다시 뛰지 않게 한다.
   */
  path: string;
  /** true면 한 칸씩이 아니라 한 번에 크게 뛴다 */
  jump: boolean;
};

const INSET = 4;
const START_DELAY_MS = 450;
// 오늘 칸에서 다음 모임까지 가는 이동을 몇 번 되풀이해 보여준다. 끝나면 도착 칸에 멈춘다.
const LOOP_COUNT = 5;
const LOOP_PAUSE_MS = 1800;
const FADE_MS = 180;

/**
 * 캘린더 칸 위를 움직이는 말. 3D 없이 DOM 요소와 Web Animations API로 그린다.
 * 날짜 그리드(위치 기준이 되는 부모 요소) 바로 안에 두고, 칸은 data-day 속성으로 찾는다.
 */
export default function CalendarPawn({ path, jump }: Props) {
  const pawnRef = useRef<HTMLDivElement>(null);

  // 그려지기 전에(layout effect) 출발 칸에 놓아서 말이 엉뚱한 곳에 잠깐 보이지 않게 한다.
  useLayoutEffect(() => {
    const pawn = pawnRef.current;
    // 부모 그리드의 ref는 처음 마운트할 때 자식의 layout effect보다 늦게 붙는다.
    // 그래서 ref 대신 DOM에서 바로 부모를 쓴다.
    const container = pawn?.parentElement;
    if (!pawn || !container) return;

    const keys = path.split(",");
    const target = keys[keys.length - 1];
    // 말은 칸의 오른쪽 위 자리에 선다. 날짜 숫자는 왼쪽 위라 겹치지 않는다.
    const slotOf = (key: string): Point | null => {
      const cell = container.querySelector<HTMLElement>(`[data-day="${key}"]`);
      if (!cell) return null;
      return {
        x: cell.offsetLeft + cell.offsetWidth - pawn.offsetWidth - INSET,
        y: cell.offsetTop + INSET,
      };
    };
    const place = (key: string) => {
      const p = slotOf(key);
      if (p) pawn.style.transform = `translate(${p.x}px, ${p.y}px)`;
    };

    let cancelled = false;
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const animations: Animation[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(setTimeout(resolve, ms));
      });
    /** 애니메이션이 끝날 때까지 기다린다. 중간에 취소되면 false */
    const played = async (animation: Animation) => {
      animations.push(animation);
      try {
        await animation.finished;
      } catch {
        return false;
      }
      return !cancelled;
    };

    const canAnimate =
      keys.length > 1 && typeof pawn.animate === "function" && !prefersReducedMotion();

    if (!canAnimate) {
      place(target);
    } else {
      place(keys[0]);
      const hops: Array<[string, string]> = jump
        ? [[keys[0], target]]
        : keys.slice(1).map((key, i) => [keys[i], key]);

      /** 오늘 칸에서 도착 칸까지 한 번 이동한다. 중간에 취소되면 false */
      const hopOnce = async () => {
        for (const [from, to] of hops) {
          const a = slotOf(from);
          const b = slotOf(to);
          if (cancelled || !a || !b) return false;
          const hop = pawn.animate(hopKeyframes(a, b, jump ? 30 : 14), {
            duration: jump ? 620 : 320,
            easing: "ease-in-out",
            fill: "forwards",
          });
          if (!(await played(hop))) return false;
          // 애니메이션이 끝난 위치를 인라인 스타일로 옮겨두고 애니메이션은 정리한다.
          pawn.style.transform = `translate(${b.x}px, ${b.y}px)`;
          hop.cancel();
        }
        return true;
      };

      // 도착하면 잠깐 쉬었다가, 사라졌다 오늘 칸에 다시 나타나 출발하는 것을 몇 번 되풀이한다.
      const run = async () => {
        await wait(START_DELAY_MS);
        for (let loop = 0; loop < LOOP_COUNT; loop++) {
          if (cancelled) return;
          if (loop > 0) {
            await wait(LOOP_PAUSE_MS);
            if (cancelled) return;
            const fadeOut = pawn.animate([{ opacity: 1 }, { opacity: 0 }], {
              duration: FADE_MS,
              fill: "forwards",
            });
            if (!(await played(fadeOut))) return;
            place(keys[0]);
            const fadeIn = pawn.animate([{ opacity: 0 }, { opacity: 1 }], {
              duration: FADE_MS,
              fill: "forwards",
            });
            if (!(await played(fadeIn))) return;
            fadeOut.cancel();
            fadeIn.cancel();
            await wait(200);
          }
          if (!(await hopOnce())) return;
        }
      };
      void run();
    }

    // 창 크기가 바뀌면 칸 위치가 달라지므로, 진행 중인 이동을 멈추고 도착 칸에 바로 놓는다.
    let lastWidth = container.offsetWidth;
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            if (container.offsetWidth === lastWidth) return;
            lastWidth = container.offsetWidth;
            cancelled = true;
            animations.forEach((animation) => animation.cancel());
            place(target);
          });
    observer?.observe(container);

    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
      animations.forEach((animation) => animation.cancel());
      observer?.disconnect();
    };
  }, [path, jump]);

  return (
    <div
      ref={pawnRef}
      aria-hidden
      data-pawn
      className="pointer-events-none absolute left-0 top-0 z-10 h-[22px] w-[18px] origin-bottom text-accent sm:h-[27px] sm:w-[22px]"
      // 위치를 잡기 전에는 화면 밖에 둔다.
      style={{ transform: "translate(-9999px, -9999px)" }}
    >
      <div className="h-full w-full motion-safe:animate-pawn-bob">
        <PawnIcon className="h-full w-full drop-shadow-[0_2px_1.5px_rgb(0_0_0/0.35)]" />
      </div>
    </div>
  );
}
