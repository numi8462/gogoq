"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/common/Logo";
import Button from "@/components/common/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Sentry 등 모니터링을 아직 붙이지 않아서, 최소한 서버/배포 로그에는
    // 스택트레이스가 남도록 한다.
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 gap-6 text-center">
      <Logo size="md" />
      <div>
        <h1 className="text-lg font-bold text-text-primary">
          문제가 발생했어요
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          페이지를 불러오는 중 오류가 생겼어요. 다시 시도해주세요.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>다시 시도</Button>
        <Button variant="secondary" onClick={() => router.push("/home")}>
          홈으로
        </Button>
      </div>
    </main>
  );
}
