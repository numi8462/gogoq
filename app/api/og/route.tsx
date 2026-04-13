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
        background: "#021926",
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
            "radial-gradient(ellipse, rgba(55,146,95,0.25) 0%, transparent 70%)",
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
            background: "#37925f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          Q
        </div>
        <span
          style={{ color: "#f0f0f5", fontSize: "32px", fontWeight: "bold" }}
        >
          gogoQ
        </span>
      </div>

      {/* 메인 타이틀 */}
      <div
        style={{
          color: "#f0f0f5",
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
          color: "#8888a0",
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
            "linear-gradient(90deg, transparent, #37925f, transparent)",
        }}
      />
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
