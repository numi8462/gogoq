"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn, EVENT_DOT_CLASSES } from "@/lib/utils";
import {
  formatEventTime,
  formatMonthDay,
  getBoardCaption,
  WEEKDAY_LABELS,
  type BoardDay,
  type BoardEvent,
  type WeekBoardModel,
} from "@/lib/weekBoard";
import WeekBoardSceneLazy from "./WeekBoardSceneLazy";

type Props = {
  /** null이면 아직 불러오는 중 */
  model: WeekBoardModel | null;
  isDemo: boolean;
  /** 일정별 참여 인원. null이면 아직 모름 */
  participantCounts: Record<string, number> | null;
  /** WebGL을 쓸 수 있을 때만 3D 장면을 띄운다. 아니면 정적인 돌이 계속 보인다. */
  show3D: boolean;
  captionOverride?: string;
  /** 일정이 하나도 없을 때 안내 문구 뒤에 붙는 다음 행동 */
  emptyHint?: string;
  /**
   * 주면 돌을 눌렀을 때 자체 일정 패널을 열지 않고 이 콜백으로 칸 번호를 넘긴다.
   * 그룹 페이지처럼 바깥(캘린더, 일정 목록)이 선택 날짜를 관리할 때 쓴다.
   */
  onDaySelect?: (index: number) => void;
  /** onDaySelect를 쓸 때 바깥에서 선택된 칸. 이번 주 밖의 날짜면 null */
  selectedIndex?: number | null;
};

// 3D 장면 대신 보여주는 정적인 돌. 장면을 불러오는 동안과 WebGL을 못 쓰는 기기에서 쓰인다.
function StaticStones({
  days,
  className,
}: {
  days: BoardDay[] | null;
  className?: string;
}) {
  // 3D 카메라 기준으로 돌이 그려지는 위치(위에서 30%, 높이 46%)에 맞춰 둬서,
  // 3D 장면으로 넘어갈 때 돌 위치가 튀지 않게 한다.
  return (
    <div aria-hidden className={cn("absolute inset-0 grid grid-cols-7", className)}>
      {WEEKDAY_LABELS.map((weekday, i) => {
        const day = days?.[i];
        return (
          <div key={weekday} className="relative">
            <div
              className={cn(
                "absolute left-[11%] right-[11%] top-[30%] h-[46%] rounded-[50%] bg-tile-default",
                day?.isToday && "bg-accent-secondary",
                day && !day.isToday && day.events.length > 0 && "bg-tile-scheduled",
                day?.isPast && "opacity-50",
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

function dayName(day: BoardDay, isDemo: boolean) {
  return isDemo
    ? `예시 ${day.weekday}요일`
    : `${formatMonthDay(day.date)} ${day.weekday}요일`;
}

function dayAriaLabel(day: BoardDay, isDemo: boolean) {
  const parts = [dayName(day, isDemo)];
  if (day.isToday) parts.push("오늘");
  parts.push(day.events.length > 0 ? `일정 ${day.events.length}개` : "일정 없음");
  return parts.join(", ");
}

function EventRow({
  event,
  isDemo,
  count,
}: {
  event: BoardEvent;
  isDemo: boolean;
  count: number | undefined;
}) {
  const capacity =
    count === undefined
      ? `최대 ${event.maxParticipants}명`
      : `${count}/${event.maxParticipants}명`;

  const content = (
    <>
      <span
        aria-hidden
        className={cn("w-2 h-2 rounded-full shrink-0", EVENT_DOT_CLASSES[event.color])}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-text-primary truncate">{event.title}</span>
        <span className="block text-xs text-text-secondary truncate">
          {event.groupName} · {formatEventTime(event)} · {capacity}
        </span>
      </span>
      {event.isClosed && (
        <span className="shrink-0 text-[10px] rounded-full px-1.5 py-0.5 bg-surface-2 text-text-secondary">
          마감
        </span>
      )}
    </>
  );

  const rowClass = "flex items-center gap-2 rounded-xl px-2 py-1.5";
  if (isDemo) return <div className={rowClass}>{content}</div>;
  return (
    <Link
      href={`/group/${event.groupId}`}
      className={cn(rowClass, "hover:bg-surface-2 transition")}
    >
      {content}
    </Link>
  );
}

export default function WeekBoardView({
  model,
  isDemo,
  participantCounts,
  show3D,
  captionOverride,
  emptyHint,
  onDaySelect,
  selectedIndex,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  // 바깥에서 선택을 관리하면 그 값을, 아니면 자체 패널의 선택 상태를 쓴다.
  const isControlled = onDaySelect !== undefined;
  const activeIndex = isControlled ? (selectedIndex ?? null) : selected;
  const [sceneReady, setSceneReady] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const dayButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const panelId = useId();

  // 보드가 화면 밖으로 나가면 3D 애니메이션 루프를 멈춘다.
  // React 19의 callback ref 정리 함수로, 보드 요소가 바뀌면 감시도 함께 옮겨간다.
  const observeBoard = useCallback((el: HTMLDivElement | null) => {
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry.isIntersecting),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const closePanel = () => {
    if (selected !== null) dayButtons.current[selected]?.focus();
    setSelected(null);
  };

  // 열린 일정 패널은 Escape로 닫고, 포커스를 누르던 요일 버튼으로 돌려준다.
  useEffect(() => {
    if (selected === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      dayButtons.current[selected]?.focus();
      setSelected(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  if (!model) {
    return (
      <section aria-label="이번 주 모임 보드" aria-busy className="w-full">
        <div className="relative w-full aspect-[7/1.7]">
          <StaticStones days={null} className="animate-pulse" />
        </div>
        <div aria-hidden className="grid grid-cols-7 text-center mt-1">
          {WEEKDAY_LABELS.map((weekday) => (
            <div key={weekday} className="flex flex-col items-center gap-0.5 leading-none">
              <span className="text-xs text-text-secondary">{weekday}</span>
              <span className="h-4" />
            </div>
          ))}
        </div>
        {/* 실제 화면과 높이를 맞춰서, 불러온 뒤 아래 카드가 밀리지 않게 두 줄 높이를 잡아둔다. */}
        <p className="mt-2 min-h-8 text-xs text-text-secondary text-center">
          이번 주 모임을 불러오는 중이에요
        </p>
      </section>
    );
  }

  const panelDay = isControlled || selected === null ? null : model.days[selected];
  const caption = captionOverride ?? getBoardCaption(model, isDemo, emptyHint);

  return (
    <section
      aria-label={isDemo ? "이번 주 모임 보드 예시" : "이번 주 모임 보드"}
      className="w-full"
    >
      <div ref={observeBoard} className="relative w-full aspect-[7/1.7]">
        <StaticStones
          days={model.days}
          className={cn("transition-opacity duration-500", sceneReady && "opacity-0")}
        />

        {show3D && (
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              sceneReady ? "opacity-100" : "opacity-0",
            )}
          >
            <WeekBoardSceneLazy
              model={model}
              selectedIndex={activeIndex}
              active={onScreen}
              onReady={() => setSceneReady(true)}
            />
          </div>
        )}

        {/* 3D 위에 겹친 요일 버튼. 키보드/스크린리더 접근은 이 층이 맡는다. */}
        <div className="absolute inset-0 grid grid-cols-7">
          {model.days.map((day, i) => (
            <button
              key={day.weekday}
              ref={(el) => {
                dayButtons.current[i] = el;
              }}
              type="button"
              onClick={() =>
                isControlled ? onDaySelect(i) : setSelected((cur) => (cur === i ? null : i))
              }
              aria-label={dayAriaLabel(day, isDemo)}
              // 바깥 선택 모드는 패널을 열지 않으므로 '눌림' 상태로, 패널 모드는 '펼침' 상태로 알린다.
              aria-pressed={isControlled ? activeIndex === i : undefined}
              aria-expanded={isControlled ? undefined : selected === i}
              aria-controls={!isControlled && selected === i ? panelId : undefined}
              className="rounded-xl outline-none transition hover:bg-text-primary/5 focus-visible:ring-2 focus-visible:ring-accent"
            />
          ))}
        </div>
      </div>

      <div aria-hidden className="grid grid-cols-7 text-center mt-1">
        {model.days.map((day) => (
          <div key={day.weekday} className="flex flex-col items-center gap-0.5 leading-none">
            <span
              className={cn(
                "text-xs",
                day.isToday ? "font-semibold text-text-primary" : "text-text-secondary",
                day.isPast && "opacity-50",
              )}
            >
              {day.weekday}
            </span>
            <span className="h-4 flex items-center">
              {day.isToday ? (
                <span className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 bg-accent-secondary text-neutral-900">
                  오늘
                </span>
              ) : isDemo ? null : (
                <span
                  className={cn(
                    "text-[11px] tabular-nums text-text-secondary",
                    day.isPast && "opacity-50",
                  )}
                >
                  {day.date.getDate()}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {panelDay && (
        <div
          id={panelId}
          role="region"
          aria-label={`${dayName(panelDay, isDemo)} 일정`}
          className="mt-3 rounded-2xl p-4 bg-surface/50 border border-(--border) text-left"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-text-primary">
              {dayName(panelDay, isDemo)}
            </p>
            <button
              type="button"
              onClick={closePanel}
              aria-label="일정 닫기"
              className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition"
            >
              <X size={14} />
            </button>
          </div>
          {panelDay.events.length === 0 ? (
            <p className="mt-2 text-xs text-text-secondary">이 날은 일정이 없어요.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1">
              {panelDay.events.map((event) => (
                <li key={event.id}>
                  <EventRow
                    event={event}
                    isDemo={isDemo}
                    count={
                      participantCounts ? (participantCounts[event.id] ?? 0) : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="mt-2 min-h-8 text-xs text-text-secondary text-center">{caption}</p>
    </section>
  );
}
