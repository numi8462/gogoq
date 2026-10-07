"use client";

import { useEffect } from "react";

// app/error.tsx는 루트 레이아웃(Providers, Toaster 등) 안에서 발생한 에러만
// 잡는다. 루트 레이아웃 자체가 렌더링에 실패하는 극단적인 경우를 대비한
// 최후의 fallback이라, Tailwind/커스텀 컴포넌트에 의존하지 않고 완전히
// 독립적인 <html>/<body>를 직접 그린다 (Next.js 공식 권장 방식).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "16px",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#f7f7f5",
          color: "#1c1d22",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
          앱을 불러오는 중 문제가 발생했어요
        </h1>
        <p style={{ fontSize: "14px", color: "#6b6d76", margin: 0 }}>
          잠시 후 다시 시도해주세요.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#ff4696",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            padding: "10px 20px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
