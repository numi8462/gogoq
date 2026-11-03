"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useToastStore } from "@/lib/store/useToastStore";

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  // 스크린리더가 새 알림을 읽도록 live region은 알림이 없을 때도 자리를 지킨다.
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center px-4 w-full pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium max-w-sm bg-surface text-text-primary border border-(--border) shadow-[0_8px_24px_-8px_rgb(18_8_31/0.3)] transition-[opacity,translate] duration-200 starting:opacity-0 starting:-translate-y-2"
        >
          {t.variant === "success" ? (
            <CheckCircle2 size={16} className="text-accent shrink-0" />
          ) : (
            <XCircle size={16} className="text-danger shrink-0" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
