import "./globals.css";
import Providers from "./providers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "gogoQ",
  description: "게임 일정 조율 사이트",
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
