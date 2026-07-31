import "./globals.css";
import Providers from "./providers";
import ThemeToggle from "@/components/common/ThemeToggle";
import type { Metadata } from "next";

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
    <html lang="ko">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <ThemeToggle />
      </body>
    </html>
  );
}
