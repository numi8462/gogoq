"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

function subscribe(callback: () => void) {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  mql.addEventListener("change", callback);
  return () => {
    mql.removeEventListener("change", callback);
    observer.disconnect();
  };
}

function getSnapshot(): boolean {
  const root = document.documentElement;
  if (root.classList.contains("dark")) return true;
  if (root.classList.contains("light")) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export default function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next = !isDark;
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="fixed bottom-4 right-20 z-40 w-10 h-10 rounded-full bg-surface-2 text-text-primary border border-(--border) shadow-md flex items-center justify-center hover:opacity-80 transition"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
