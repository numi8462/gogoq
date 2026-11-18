"use client";

import { useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Logo, { QMark } from "@/components/common/Logo";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { ArrowRight, LogOut } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useMyGroups } from "@/hooks/useMyGroups";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import HomeWeekBoard from "@/components/home/HomeWeekBoard";
import StartBoard from "@/components/home/StartBoard";
import { guestBoardContent, liveBoardContent } from "@/components/home/BoardContent";
import { useWeekBoardEvents } from "@/hooks/useWeekBoard";
import {
  buildWeekBoard,
  describeWhen,
  getWeekStart,
  nextEventByGroup,
  toBoardEvent,
} from "@/lib/weekBoard";

const NO_IDS: string[] = [];

// 로그인 세션 쿠키가 있는지만 본다(내용은 읽지 않는다). 홈은 게스트 화면으로 미리 렌더되므로,
// 로그인한 사람이 내 정보를 불러오는 동안 게스트용 예시 보드가 잠깐 보였다가 바뀌지 않게 하는 힌트다.
const noopSubscribe = () => () => {};
const hasAuthCookie = () => /(^|;\s*)sb-[^=]+-auth-token/.test(document.cookie);

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const { data: myGroups = [], isPending: isMyGroupsPending } = useMyGroups(user?.id);
  const [now] = useState(() => new Date());
  const weekStart = useMemo(() => getWeekStart(now), [now]);
  const groupIds = useMemo(() => myGroups.map((g) => g.id).sort(), [myGroups]);
  // 이번 주 일정은 방 목록이 오는 즉시 요청한다(로그인 확인 응답을 기다리지 않는다).
  // 아래 3D 보드(HomeWeekBoard)와 같은 쿼리라 한 번만 불러온다.
  const eventsQuery = useWeekBoardEvents(user ? groupIds : NO_IDS, weekStart);

  // 로그인 확인, 참여한 방, 이번 주 일정이 모두 준비된 뒤에 한 번에 그린다.
  // 하나씩 도착할 때마다 버튼 → 방 목록 → 다음 모임 순으로 화면이 바뀌지 않게 하기 위함이다.
  const isReady =
    !isUserLoading &&
    (!user || (!isMyGroupsPending && (myGroups.length === 0 || !eventsQuery.isPending)));
  // 보여줄 내 방이 있으면 실제 이번 주 일정, 없으면(게스트 포함) 예시 보드
  const boardMode = !isReady ? "loading" : user && myGroups.length > 0 ? "live" : "demo";
  // 참여한 방이 있으면 첫 화면 보드에 실제 상태(참여한 방, 이번 주, 다음 모임)를 놓는다.
  const isLive = boardMode === "live";
  const liveEvents = useMemo(() => {
    if (!eventsQuery.data) return eventsQuery.isError ? [] : null;
    const nameById = new Map(myGroups.map((g) => [g.id, g.name || "이름 없는 그룹"]));
    return eventsQuery.data.map((e) => toBoardEvent(e, nameById));
  }, [eventsQuery.data, eventsQuery.isError, myGroups]);
  const liveModel = useMemo(
    () => (liveEvents ? buildWeekBoard(liveEvents, now) : null),
    [liveEvents, now],
  );
  const nextByGroup = useMemo(
    () => nextEventByGroup(liveEvents ?? [], now),
    [liveEvents, now],
  );
  const likelySignedIn = useSyncExternalStore(noopSubscribe, hasAuthCookie, () => false);
  const boardContent = isLive
    ? liveBoardContent(myGroups, liveModel, now)
    : boardMode === "loading" && likelySignedIn
      ? liveBoardContent(null, null, now)
      : guestBoardContent();

  const [isLoading, setIsLoading] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();
  const [codeError, setCodeError] = useState<string | undefined>();
  const inviteInputId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // 그룹을 만드는 동안 보드의 말이 GOAL까지 올라간다. 요청과 말의 도착이 둘 다 끝나야 이동한다.
  const [climbing, setClimbing] = useState(false);
  const arrivedRef = useRef(false);
  const pendingPathRef = useRef<string | null>(null);

  const handleArrive = () => {
    arrivedRef.current = true;
    if (pendingPathRef.current) router.push(pendingPathRef.current);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  const handleCreate = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;
    if (!groupName.trim()) {
      setNameError("그룹 이름을 입력해주세요.");
      nameInputRef.current?.focus();
      return;
    }
    setIsLoading(true);
    setError(null);
    arrivedRef.current = false;
    pendingPathRef.current = null;
    setClimbing(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName.trim() }),
      });
      const { data, error } = await res.json();
      if (error) throw new Error(error);
      const path = `/group/${data.id}`;
      if (arrivedRef.current) router.push(path);
      else pendingPathRef.current = path;
    } catch {
      setError("그룹 생성에 실패했어요. 다시 시도해주세요.");
      setIsLoading(false);
      setClimbing(false);
    }
  };

  const handleJoin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = inviteInput.trim();
    if (isLoading) return;
    if (!code) {
      setCodeError("초대 코드를 입력해주세요.");
      codeInputRef.current?.focus();
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${code}`);
      const { data, error } = await res.json();
      if (error) throw new Error(error);
      router.push(`/group/${data.id}`);
    } catch {
      setError("초대 코드를 찾을 수 없어요.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-bg">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6">
        <Logo size="md" />
        {/* 준비되기 전에는 버튼 크기만큼 자리를 비워둬서, 나타날 때 레이아웃이 움직이지 않게 한다. */}
        {!isReady ? (
          <span aria-hidden className="h-10 w-24" />
        ) : (
          user ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1.5"
            >
              <LogOut size={14} /> 로그아웃
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => router.push("/login")}>
              로그인
            </Button>
          )
        )}
      </header>

      <main>
        <section
          aria-labelledby="home-title"
          className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:pb-24"
        >
          <StartBoard
            {...boardContent}
            climbing={climbing}
            onArrive={handleArrive}
            createForm={
              <form onSubmit={handleCreate} className="flex flex-col gap-2.5">
                <Input
                  ref={nameInputRef}
                  aria-label="그룹 이름"
                  value={groupName}
                  error={nameError}
                  onChange={(e) => {
                    setGroupName(e.target.value);
                    setNameError(undefined);
                  }}
                  placeholder="그룹 이름 (예: 고고큐 친구들)"
                  maxLength={30}
                />
                <Button
                  type="submit"
                  isLoading={isLoading && climbing}
                  className="flex w-full items-center justify-center gap-1.5"
                >
                  그룹 만들기 <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            }
          />

          {/* 초대 코드로 입장: START 칸 바로 아래, 같은 너비 */}
          <form
            onSubmit={handleJoin}
            className="mt-10 flex flex-col gap-2 lg:w-[calc((100%-55px)*5/12+20px)]"
          >
            <label htmlFor={inviteInputId} className="text-sm font-medium text-text-secondary">
              초대 코드가 있나요?
            </label>
            <div className="flex items-start gap-2">
              <Input
                ref={codeInputRef}
                id={inviteInputId}
                value={inviteInput}
                error={codeError}
                onChange={(e) => {
                  setInviteInput(e.target.value);
                  setCodeError(undefined);
                }}
                placeholder="초대 코드 (예: aB3kR9mX)"
              />
              <Button
                type="submit"
                variant="secondary"
                isLoading={isLoading && !climbing}
                className="shrink-0"
              >
                입장
              </Button>
            </div>
          </form>

          {error && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {error}
            </p>
          )}
        </section>

        {/* 참여한 방 (로그인 시에만) */}
        {isLive && (
          <section
            aria-labelledby="rooms-title"
            className="mx-auto max-w-6xl px-4 pb-20 sm:px-6"
          >
            <h2
              id="rooms-title"
              className="text-2xl font-extrabold tracking-[-0.03em] text-text-primary"
            >
              참여한 방
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myGroups.map((g) => {
                const next = nextByGroup.get(g.id);
                return (
                  <li key={g.id}>
                    <button
                      onClick={() => router.push(`/group/${g.id}`)}
                      className={cn(
                        "group flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition-[transform,box-shadow] duration-150",
                        "hover:-translate-y-0.5 hover:shadow-[0_6px_0_var(--edge)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--edge)] shadow-[0_4px_0_var(--edge)]",
                        next
                          ? "border-cell-scheduled-edge bg-cell-scheduled [--edge:var(--color-cell-scheduled-edge)]"
                          : "border-cell-edge bg-cell [--edge:var(--color-cell-edge)]",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-base font-semibold text-text-primary">
                          {g.name || "이름 없는 그룹"}
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-text-primary/75">
                          {next
                            ? `다음 · ${describeWhen(next.start, now)} ${next.title}`
                            : liveEvents
                              ? "예정된 일정 없음"
                              : " "}
                        </span>
                      </span>
                      <ArrowRight
                        aria-hidden
                        className="h-4 w-4 shrink-0 text-accent transition-transform duration-200 group-hover:translate-x-0.5"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* 이번 주 징검다리 보드 */}
        <section aria-labelledby="week-title" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="rounded-4xl border border-(--border) bg-surface px-5 py-8 sm:px-10 sm:py-10">
            <h2
              id="week-title"
              className="text-2xl font-extrabold tracking-[-0.03em] text-text-primary"
            >
              이번 주 모임
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {boardMode === "live"
                ? "참여한 방들의 이번 주 일정이 한 보드에 모여요. 돌을 누르면 그날 일정이 보여요."
                : "로그인하면 참여한 방들의 이번 주 일정이 한 보드에 모여요."}
            </p>
            <div className="mx-auto mt-8 max-w-3xl">
              <HomeWeekBoard mode={boardMode} groups={myGroups} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-(--border)">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-8 text-sm text-text-secondary sm:px-6">
          <QMark className="h-5 w-5 text-accent" />
          <span>gogoQ · 친구들과 게임 일정 맞추기</span>
        </div>
      </footer>
    </div>
  );
}
