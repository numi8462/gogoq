// Pretendard 웹폰트. 한글 글자를 여러 조각(unicode-range)으로 나눈 버전이라
// 브라우저가 화면에 실제로 쓰인 글자가 든 조각만 내려받는다.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { Bowlby_One } from "next/font/google";
import Providers from "./providers";
import Toaster from "@/components/common/Toaster";
import type { Metadata, Viewport } from "next";

// 로고 워드마크("gogo")용 디스플레이 폰트. next/font가 빌드 시 받아서 자체 호스팅한다.
const bowlbyOne = Bowlby_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bowlby-one",
});

export const metadata: Metadata = {
  title: {
    default: "gogoq",
    template: "%s | gogoq",
  },
  description: "게임 일정, 쉽게 맞추자. 그룹 만들고 링크 공유하면 끝.",
  keywords: ["게임", "일정", "조율", "캘린더", "모집"],
  openGraph: {
    title: "gogoq",
    description: "게임 일정, 쉽게 맞추자",
    url: "https://gogoq.vercel.app",
    siteName: "gogoq",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/icon.png",
        width: 1200,
        height: 630,
        alt: "gogoq - 게임 일정 조율 서비스",
      },
    ],
  },
};

// 다크 테마만 쓰므로 모바일 브라우저 주소창과 기본 UI도 같은 보라색과 다크 스킴으로 맞춘다.
export const viewport: Viewport = {
  themeColor: "#1e1033",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={bowlbyOne.variable}>
      <body>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
