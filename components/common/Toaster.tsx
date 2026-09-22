"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useToastStore } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center px-4 w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm shadow-lg border max-w-sm",
            "bg-bg text-text-primary",
            t.variant === "success" ? "border-accent" : "border-danger",
          )}
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
