"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/common/Logo";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { ArrowRight, LogOut } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useMyGroups } from "@/hooks/useMyGroups";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const { data: myGroups = [] } = useMyGroups(user?.id);
  const [isLoading, setIsLoading] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName.trim() }),
      });
      const { data, error } = await res.json();
      if (error) throw new Error(error);
      router.push(`/group/${data.id}`);
    } catch {
      setError("그룹 생성에 실패했어요. 다시 시도해주세요.");
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    const code = inviteInput.trim();
    if (!code) return;
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
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-10">
      {/* 로그인 상태 */}
      <div className="fixed top-4 right-4 z-40">
        {!isUserLoading &&
          (user ? (
            <Button
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1"
            >
              <LogOut size={12} /> 로그아웃
            </Button>
          ) : (
            <Button size="sm" onClick={() => router.push("/login")}>
              로그인
            </Button>
          ))}
      </div>

      <div className="relative w-full max-w-md flex flex-col gap-6">
        {/* 로고 */}
        <div className="text-center flex flex-col items-center gap-10 mb-2">
          <Logo size="md" />
          <div>
            <h1 className="text-3xl font-bold text-text-primary leading-tight">
              바쁜 현대 사회
              <br />
              쉽게 게임 일정을 맞추세요
            </h1>
            <p className="text-sm text-text-secondary mt-2">
              그룹 만들고 링크 공유하면 끝
            </p>
          </div>
        </div>

        {/* 참여한 방 (로그인 시에만) */}
        {user && myGroups.length > 0 && (
          <div className="rounded-2xl p-5 flex flex-col gap-3 bg-surface/50 border border-(--border)">
            <p className="text-sm font-semibold text-text-primary">
              참여한 방
            </p>
            <div className="flex flex-col gap-2">
              {myGroups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => router.push(`/group/${g.id}`)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm bg-accent text-white hover:bg-accent-hover transition text-left"
                >
                  {g.name || "이름 없는 그룹"}
                  <ArrowRight className="h-3 w-3 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 새 그룹 만들기 */}
        <div className="rounded-2xl p-5 flex flex-col gap-3 bg-surface/50 border border-(--border)">
          <div>
            <p className="text-sm font-semibold text-text-primary">
              새 그룹 만들기
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              초대 링크를 공유하면 친구들이 바로 참여해요
            </p>
          </div>
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="그룹 이름 (예: 고고큐 친구들)"
            maxLength={30}
          />
          <Button
            onClick={handleCreate}
            disabled={!groupName.trim()}
            isLoading={isLoading}
            className="w-full flex items-center justify-center gap-1"
          >
            그룹 만들기 <ArrowRight className="h-3 w-3" />
          </Button>
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-3">
          <hr className="flex-1 border-(--border)" />
          <span className="text-xs text-text-secondary">또는</span>
          <hr className="flex-1 border-(--border)" />
        </div>

        {/* 초대 코드로 입장 */}
        <div className="rounded-2xl p-5 flex flex-col gap-3 bg-surface/50 border border-(--border)">
          <p className="text-sm font-semibold text-text-primary">
            초대 코드로 입장
          </p>
          <Input
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="초대 코드 입력 (예: aB3kR9mX)"
          />
          <Button
            variant="primary"
            onClick={handleJoin}
            disabled={!inviteInput.trim()}
            isLoading={isLoading}
            className="w-full"
          >
            입장하기
          </Button>
        </div>

        {error && <p className="text-xs text-danger text-center">{error}</p>}
      </div>
    </main>
  );
}
