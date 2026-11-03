"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { cn, prefersReducedMotion } from "@/lib/utils";
import { hopKeyframes, type Point } from "@/lib/pawnHop";
import PawnIcon from "@/components/board/PawnIcon";

type Props = {
  /** 왼쪽 위 큰 제목과 그 아래 한 줄 */
  headline: React.ReactNode;
  subline: React.ReactNode;
  /** START 칸에 들어가는 그룹 만들기 폼 */
  createForm: React.ReactNode;
  /** START와 GOAL 사이 두 칸의 내용 (각 칸의 제목 포함) */
  steps: [React.ReactNode, React.ReactNode];
  /** GOAL 칸의 내용과, 스크린리더가 읽을 GOAL 칸의 이름 */
  goal: React.ReactNode;
  goalLabel: string;
  /** true가 되면 말이 START에서 GOAL까지 계단을 올라간다. 다시 false가 되면 START로 돌아온다. */
  climbing: boolean;
  /** 말이 GOAL에 도착했을 때. 동작 줄이기 설정이면 바로 불린다. */
  onArrive: () => void;
};

const LAST_STEP = 3;
const PAWN_INSET = 18;

// 말은 칸 윗면의 오른쪽에 선다. 칸 위치는 화면 폭에 따라 바뀌므로 매번 DOM에서 잰다.
function slotOf(board: HTMLElement, pawn: HTMLElement, step: number): Point | null {
  const tile = board.querySelector<HTMLElement>(`[data-step="${step}"]`);
  if (!tile) return null;
  const b = board.getBoundingClientRect();
  const t = tile.getBoundingClientRect();
  return {
    x: t.right - b.left - pawn.offsetWidth - PAWN_INSET,
    y: t.top - b.top - pawn.offsetHeight + 4,
  };
}

function place(board: HTMLElement, pawn: HTMLElement, step: number) {
  const p = slotOf(board, pawn, step);
  if (p) pawn.style.transform = `translate(${p.x}px, ${p.y}px)`;
}

/**
 * 홈 첫 화면의 보드. START(그룹 만들기) → 링크 공유 → 닉네임 참여 → GOAL(일정 확정)이
 * 계단처럼 올라가는 길이고, 그룹을 만들면 말이 그 길을 올라간다.
 * 넓은 화면에서는 아래에 점선 빈 칸을 쌓아 계단을 만들고, 좁은 화면에서는 위에서 아래로 지그재그로 놓는다.
 */
export default function StartBoard({
  headline,
  subline,
  createForm,
  steps,
  goal,
  goalLabel,
  climbing,
  onArrive,
}: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const pawnRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(0);
  const onArriveRef = useRef(onArrive);
  useEffect(() => {
    onArriveRef.current = onArrive;
  });

  // 처음에는 START 칸 위로 살짝 떨어지며 내려앉는다.
  useLayoutEffect(() => {
    const pawn = pawnRef.current;
    const board = boardRef.current;
    if (!pawn || !board) return;
    place(board, pawn, 0);
    const p = slotOf(board, pawn, 0);
    let drop: Animation | undefined;
    if (p && typeof pawn.animate === "function" && !prefersReducedMotion()) {
      drop = pawn.animate(
        [
          { transform: `translate(${p.x}px, ${p.y - 36}px)`, opacity: 0 },
          { transform: `translate(${p.x}px, ${p.y}px) scale(1.12, 0.86)`, opacity: 1, offset: 0.7 },
          { transform: `translate(${p.x}px, ${p.y}px)`, opacity: 1 },
        ],
        { duration: 460, delay: 250, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "backwards" },
      );
    }

    // 창 크기가 바뀌면 지금 서 있는 칸에 다시 놓는다.
    let lastWidth = board.offsetWidth;
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            if (board.offsetWidth === lastWidth) return;
            lastWidth = board.offsetWidth;
            pawn.getAnimations().forEach((a) => a.cancel());
            place(board, pawn, stepRef.current);
          });
    observer?.observe(board);
    return () => {
      drop?.cancel();
      observer?.disconnect();
    };
  }, []);

  // 그룹을 만드는 동안 말이 한 칸씩 올라가고, 실패하면 START로 한 번에 돌아온다.
  useEffect(() => {
    const pawn = pawnRef.current;
    const board = boardRef.current;
    if (!pawn || !board) return;
    const reduced = typeof pawn.animate !== "function" || prefersReducedMotion();

    if (climbing && reduced) {
      stepRef.current = LAST_STEP;
      place(board, pawn, LAST_STEP);
      onArriveRef.current();
      return;
    }
    if (!climbing && reduced) {
      stepRef.current = 0;
      place(board, pawn, 0);
      return;
    }

    let cancelled = false;
    const hop = async (to: number, height: number, duration: number) => {
      const a = slotOf(board, pawn, stepRef.current);
      const b = slotOf(board, pawn, to);
      if (!a || !b) return false;
      const animation = pawn.animate(hopKeyframes(a, b, height), {
        duration,
        easing: "ease-in-out",
        fill: "forwards",
      });
      try {
        await animation.finished;
      } catch {
        return false;
      }
      if (cancelled) return false;
      stepRef.current = to;
      pawn.style.transform = `translate(${b.x}px, ${b.y}px)`;
      animation.cancel();
      return true;
    };

    const run = async () => {
      if (climbing) {
        while (stepRef.current < LAST_STEP) {
          if (!(await hop(stepRef.current + 1, 34, 340))) return;
        }
        onArriveRef.current();
      } else if (stepRef.current !== 0) {
        await hop(0, 60, 560);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [climbing]);

  return (
    <div
      ref={boardRef}
      className="relative flex flex-col gap-5 lg:grid lg:grid-cols-12 lg:grid-rows-[1fr_auto] lg:gap-x-5 lg:gap-y-0"
    >
      <div className="lg:col-span-8 lg:col-start-1 lg:row-start-1 lg:pb-14">
        <h1
          id="home-title"
          className="text-[2.5rem] font-extrabold leading-[1.12] tracking-[-0.035em] text-text-primary sm:text-6xl lg:text-[3.5rem]"
        >
          {headline}
        </h1>
        <p className="mt-4 text-lg text-text-secondary">{subline}</p>
      </div>

      {/* START: 그룹 만들기 */}
      <section
        aria-labelledby="start-title"
        data-step="0"
        className={cn(
          tileBase,
          "border-accent bg-surface [--edge:color-mix(in_srgb,var(--color-accent)_62%,black)]",
          "lg:col-span-5 lg:col-start-1 lg:row-start-2",
        )}
      >
        <h2 id="start-title" className="font-bowlby text-3xl leading-none text-accent">
          <span aria-hidden>START</span>
          <span className="sr-only">새 그룹 만들기</span>
        </h2>
        <p className="mt-3 text-base font-medium text-text-primary">
          그룹을 만들고 링크를 공유하면 친구들이 바로 참여해요
        </p>
        <div className="mt-4">{createForm}</div>
      </section>

      <Step ghosts={1} className="lg:col-span-3 lg:col-start-6 sm:w-[64%] w-[86%] self-end">
        <section data-step="1" className={cn(tileBase, cellTile)}>
          {steps[0]}
        </section>
      </Step>

      <Step ghosts={2} className="lg:col-span-2 lg:col-start-9 sm:w-[64%] w-[86%] self-start">
        <section data-step="2" className={cn(tileBase, cellTile)}>
          {steps[1]}
        </section>
      </Step>

      <Step ghosts={3} className="lg:col-span-2 lg:col-start-11 sm:w-[64%] w-[86%] self-end">
        <section
          data-step="3"
          className={cn(
            tileBase,
            "border-cell-scheduled-edge bg-cell-scheduled [--edge:var(--color-cell-scheduled-edge)]",
          )}
        >
          <h2 className="font-bowlby text-3xl leading-none text-text-primary">
            <span aria-hidden>GOAL</span>
            <span className="sr-only">{goalLabel}</span>
          </h2>
          {goal}
        </section>
      </Step>

      <div
        ref={pawnRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-10 h-[44px] w-9 origin-bottom text-accent"
        style={{ transform: "translate(-9999px, -9999px)" }}
      >
        <div className="h-full w-full motion-safe:animate-pawn-bob">
          <PawnIcon className="h-full w-full drop-shadow-[0_3px_2px_rgb(0_0_0/0.3)]" />
        </div>
      </div>
    </div>
  );
}

const tileBase = "relative flex flex-col rounded-3xl border p-5 shadow-[0_6px_0_var(--edge)] lg:h-[260px]";
const cellTile = "border-cell-edge bg-cell [--edge:var(--color-cell-edge)]";

/** 계단 한 칸. 넓은 화면에서는 아래에 점선 빈 칸을 쌓아서 그만큼 높이 올라간다. */
function Step({
  ghosts,
  className,
  children,
}: {
  ghosts: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2.5 lg:row-span-2 lg:row-start-1 lg:w-auto lg:self-end", className)}>
      {children}
      {Array.from({ length: ghosts }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className="hidden h-12 rounded-2xl border-2 border-dashed border-text-secondary/25 lg:block"
        />
      ))}
    </div>
  );
}
