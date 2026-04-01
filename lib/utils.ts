import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

export const EVENT_BADGE_CLASSES: Record<EventColorFromUtils, string> = {
  blue: "bg-blue-900 text-blue-400",
  red: "bg-rose-900 text-rose-300",
  green: "bg-emerald-900 text-emerald-400",
  purple: "bg-violet-900 text-violet-300",
  orange: "bg-amber-900 text-amber-400",
  gray: "bg-slate-800 text-slate-300",
};
