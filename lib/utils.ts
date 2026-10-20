import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 사용자가 기기에서 "동작 줄이기"를 켰는지. matchMedia가 없는 환경(테스트용 DOM 등)에서는 false */
export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export const EVENT_COLORS = [
  "blue",
  "red",
  "green",
  "purple",
  "orange",
  "gray",
] as const;
export type EventColorFromUtils = (typeof EVENT_COLORS)[number];

export const EVENT_DOT_CLASSES: Record<EventColorFromUtils, string> = {
  blue: "bg-blue-500",
  red: "bg-red-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  gray: "bg-gray-500",
};

// EVENT_DOT_CLASSES(Tailwind 500 계열)와 같은 색의 값. 클래스를 쓸 수 없는 곳에서 쓴다:
// 3D 장면의 깃발, 캘린더 깃발, 배지의 옅은 배경과 색 띠(color-mix로 테마와 섞는다).
export const EVENT_COLOR_HEX: Record<EventColorFromUtils, string> = {
  blue: "#3b82f6",
  red: "#ef4444",
  green: "#22c55e",
  purple: "#a855f7",
  orange: "#f97316",
  gray: "#6b7280",
};
