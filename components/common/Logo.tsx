import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  /** sm: 마크만 (그룹 헤더), md: 워드마크 (홈 상단), lg: 큰 워드마크 (로그인, 에러) */
  size?: "sm" | "md" | "lg";
};

/**
 * gogoQ의 Q 마크. 굵은 링과, 링을 뚫고 앞으로 나가는 화살표 꼬리.
 * 워드마크(Bowlby One)와 같은 두께로 맞춘 벡터라 어느 크기에서도 선명하다. 색은 currentColor.
 * app/icon.svg(파비콘)도 같은 도형을 쓴다.
 */
export function QMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className}>
      <circle cx="28" cy="28" r="17.5" fill="none" stroke="currentColor" strokeWidth="12" />
      <path
        d="M27.5 34.5 43.5 50.5 39.2 54.8 57 57 54.8 39.2 50.5 43.5 34.5 27.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Logo({ size = "md" }: Props) {
  if (size === "sm") {
    return (
      <Link href="/home" aria-label="gogoQ 홈" className="text-accent" draggable="false">
        <QMark className="h-8 w-8" />
      </Link>
    );
  }

  return (
    <Link
      href="/home"
      aria-label="gogoQ 홈"
      draggable="false"
      className={cn(
        "inline-flex items-baseline font-bowlby leading-none text-accent",
        size === "lg" ? "text-6xl" : "text-[2rem]",
      )}
    >
      gogo
      <QMark className="ml-[0.02em] h-[0.86em] w-[0.86em] translate-y-[0.08em]" />
    </Link>
  );
}
