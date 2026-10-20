// Pretendard 웹폰트. 한글 글자를 여러 조각(unicode-range)으로 나눈 버전이라
// 브라우저가 화면에 실제로 쓰인 글자가 든 조각만 내려받는다.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { Bowlby_One } from "next/font/google";
import Providers from "./providers";
import ThemeToggle from "@/components/common/ThemeToggle";
import Toaster from "@/components/common/Toaster";
import type { Metadata } from "next";

// 로고 워드마크("gogo")용 디스플레이 폰트. next/font가 빌드 시 받아서 자체 호스팅한다.
const bowlbyOne = Bowlby_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bowlby-one",
});

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.classList.add(t);}}catch(e){}})();`;

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // THEME_INIT_SCRIPT가 hydration 전에 <html>에 light/dark 클래스를 붙이므로
    // 서버 HTML과 className이 달라지는 게 의도된 동작이다. <html> 한 단계만 경고를 끈다.
    <html lang="ko" className={bowlbyOne.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <ThemeToggle />
        <Toaster />
      </body>
    </html>
  );
}
