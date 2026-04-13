import "./globals.css";
import Providers from "./providers";
import type { Metadata } from "next";

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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
