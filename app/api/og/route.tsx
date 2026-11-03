import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") ?? "게임 같이 할 사람 모집 중";

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        background: "#1e1033",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        fontFamily: "sans-serif",
      }}
    >
      {/* 배경 글로우 */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(255,70,150,0.25) 0%, transparent 70%)",
        }}
      />

      {/* 로고 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "#ff4696",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* components/common/Logo.tsx의 QMark와 같은 도형 */}
          <svg width="34" height="34" viewBox="0 0 64 64">
            <circle cx="28" cy="28" r="17.5" fill="none" stroke="white" strokeWidth="12" />
            <path
              d="M27.5 34.5 43.5 50.5 39.2 54.8 57 57 54.8 39.2 50.5 43.5 34.5 27.5Z"
              fill="white"
              stroke="white"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span
          style={{ color: "#f2f2f0", fontSize: "32px", fontWeight: "bold" }}
        >
          gogoQ
        </span>
      </div>

      {/* 메인 타이틀 */}
      <div
        style={{
          color: "#f2f2f0",
          fontSize: title.length > 20 ? "40px" : "52px",
          fontWeight: "bold",
          textAlign: "center",
          maxWidth: "900px",
          lineHeight: 1.3,
          marginBottom: "24px",
        }}
      >
        {title}
      </div>

      {/* 서브 텍스트 */}
      <div
        style={{
          color: "#9a9ca5",
          fontSize: "24px",
          textAlign: "center",
        }}
      >
        gogoQ에서 참여하세요
      </div>

      {/* 하단 보더 */}
      <div
        style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          right: "0",
          height: "4px",
          background:
            "linear-gradient(90deg, transparent, #ff4696, transparent)",
        }}
      />
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
