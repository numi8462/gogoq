import Link from "next/link";
import { ArrowRight, Link2 } from "lucide-react";
import type { Group } from "@/types";
import { cn } from "@/lib/utils";
import {
  describeDay,
  describeWhen,
  formatTime,
  WEEKDAY_LABELS,
  type WeekBoardModel,
} from "@/lib/weekBoard";

/** StartBoard에 넣는 내용. START 칸(그룹 만들기 폼)과 칸 모양은 StartBoard가 그린다. */
export type BoardContent = {
  headline: React.ReactNode;
  subline: React.ReactNode;
  steps: [React.ReactNode, React.ReactNode];
  goal: React.ReactNode;
  goalLabel: string;
};

const stepTitle = "text-base font-bold text-text-primary";
const stepNote = "mt-1 text-sm text-text-primary/75";
const bigValue = "mt-3 text-2xl font-extrabold tabular-nums tracking-[-0.02em] text-text-primary";

/** 처음 온 사람(게스트, 참여한 방이 없는 사용자): 만들기 → 공유 → 참여 → 확정 흐름을 예시로 보여준다. */
export function guestBoardContent(): BoardContent {
  return {
    headline: (
      <>
        바쁜 현대 사회
        <br />
        쉽게 <span className="text-accent">게임 일정</span>을 맞추세요
      </>
    ),
    subline: "그룹 만들고 링크 공유하면 끝",
    steps: [
      <>
        <h2 className={stepTitle}>링크 공유</h2>
        <p className={stepNote}>단톡방에 초대 링크만 보내요</p>
        <span aria-hidden className="mt-4 flex flex-col gap-2 lg:mt-auto">
          <span className="self-start rounded-2xl rounded-bl-md bg-surface px-3 py-2 text-sm text-text-primary">
            이번 주 롤 언제 돼? 여기서 정하자
          </span>
          <span className="inline-flex max-w-full items-center gap-1.5 self-start rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-text-primary">
            <Link2 size={14} className="shrink-0 text-accent" />
            <span className="truncate">gogoq.vercel.app/invite/aB3kR9mX</span>
          </span>
        </span>
      </>,
      <>
        <h2 className={stepTitle}>닉네임으로 참여</h2>
        <p className={stepNote}>가입 없이 바로</p>
        <p aria-hidden className={bigValue}>
          2/5명
        </p>
        <span aria-hidden className="mt-4 flex flex-wrap gap-1.5 lg:mt-auto">
          <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-white">고고큐</span>
          <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-text-primary">롤린이</span>
          <span className="rounded-full border border-dashed border-cell-edge px-2.5 py-1 text-xs font-medium text-text-primary/70">
            대기중
          </span>
        </span>
      </>,
    ],
    goal: (
      <>
        <p aria-hidden className={bigValue}>
          금 20:00
        </p>
        <p aria-hidden className="text-xs font-medium text-text-primary/75">
          롤 내전 · 4/5명
        </p>
        <p className="mt-2 text-sm text-text-primary/75 lg:mt-auto">모두에게 같은 일정이 실시간으로 보여요</p>
      </>
    ),
    goalLabel: "일정 확정",
  };
}

/**
 * 참여한 방이 있는 로그인 사용자: 같은 보드에 실제 내 상태를 놓는다.
 * 참여한 방 → 이번 주 → GOAL(다음 모임). groups/model이 null이면 아직 불러오는 중이다.
 */
export function liveBoardContent(
  groups: Group[] | null,
  model: WeekBoardModel | null,
  now: Date,
): BoardContent {
  const next = model?.nextEvent ?? null;
  const weekCount = model ? model.days.reduce((sum, d) => sum + d.events.length, 0) : null;
  const shownGroups = groups?.slice(0, 2) ?? [];
  const moreGroups = groups ? groups.length - shownGroups.length : 0;

  const headline = !model ? (
    <span className="text-text-secondary">
      이번 주 모임을
      <br />
      불러오는 중이에요
    </span>
  ) : next ? (
    <>
      다음 모임은
      <br />
      <span className="text-accent">{describeWhen(next.start, now)}</span>
    </>
  ) : (
    <>
      이번 주 모임을
      <br />
      <span className="text-accent">잡아볼까요?</span>
    </>
  );

  const subline = next
    ? `${next.title} · ${next.groupName}`
    : "참여한 방에 들어가 일정을 추가하거나, 새 그룹을 만들어보세요.";

  return {
    headline,
    subline,
    steps: [
      <>
        <h2 className={stepTitle}>참여한 방</h2>
        <p className={cn(bigValue, !groups && "text-text-primary/40")}>
          {groups ? `${groups.length}개` : "–"}
        </p>
        <ul className="mt-4 flex flex-col gap-1.5 lg:mt-auto">
          {shownGroups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/group/${g.id}`}
                className="group flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:text-accent"
              >
                <span className="truncate">{g.name || "이름 없는 그룹"}</span>
                <ArrowRight
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-accent transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
        {moreGroups > 0 && (
          <a
            href="#rooms-title"
            className="mt-2 self-start text-xs font-semibold text-text-primary/75 underline-offset-4 hover:underline"
          >
            {moreGroups}개 더 보기
          </a>
        )}
      </>,
      <>
        <h2 className={stepTitle}>이번 주</h2>
        <p className={cn(bigValue, weekCount === null && "text-text-primary/40")}>
          {weekCount === null ? "–" : `${weekCount}개`}
        </p>
        <p className="text-xs font-medium text-text-primary/75">모임</p>
        <div aria-hidden className="mt-4 lg:mt-auto">
          <div className="grid grid-cols-7 gap-1">
            {(model?.days ?? WEEKDAY_LABELS.map(() => null)).map((day, i) => (
              <span
                key={i}
                className={cn(
                  "h-6 rounded-md border",
                  day && day.events.length > 0
                    ? "border-cell-scheduled-edge bg-cell-scheduled"
                    : "border-cell-edge bg-surface/60",
                  day?.isToday && "ring-2 ring-accent-secondary ring-offset-1 ring-offset-cell",
                  day?.isPast && "opacity-50",
                )}
              />
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 text-center text-[10px] font-medium text-text-primary/60">
            {WEEKDAY_LABELS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
        </div>
      </>,
    ],
    goal: next ? (
      <>
        <p className="mt-3 text-sm font-semibold text-text-primary">{describeDay(next.start, now)}</p>
        <p className="text-2xl font-extrabold tabular-nums tracking-[-0.02em] text-text-primary">
          {formatTime(next.start)}
        </p>
        <p className="truncate text-xs font-medium text-text-primary/75">{next.title}</p>
        <Link
          href={`/group/${next.groupId}`}
          className="group mt-4 inline-flex max-w-full items-center gap-1 self-start rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:text-accent lg:mt-auto"
        >
          <span className="truncate">{next.groupName}</span>
          <ArrowRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-accent" />
        </Link>
      </>
    ) : (
      <>
        <p className="mt-3 text-xl font-extrabold text-text-primary">{model ? "아직 없어요" : "–"}</p>
        <p className="mt-2 text-sm text-text-primary/75 lg:mt-auto">방에서 일정을 추가하면 여기에 떠요</p>
      </>
    ),
    goalLabel: "다음 모임",
  };
}
