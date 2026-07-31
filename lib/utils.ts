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
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400",
  red: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400",
  purple: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  orange: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-400",
  gray: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};
