"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export default function Modal({ onClose, title, children, className }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // 열릴 때 포커스를 모달 안으로 옮기고, 닫히면 열기 전에 있던 곳으로 돌려준다.
  // 안쪽 입력칸에 autoFocus가 있으면 그쪽이 먼저 포커스를 가져가므로 건드리지 않는다.
  useEffect(() => {
    const previous = document.activeElement;
    if (!panelRef.current?.contains(document.activeElement)) {
      panelRef.current?.focus();
    }
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  // Escape는 가장 안쪽 모달만 닫도록 여기서 멈춘다 (일정 수정 모달 위의 삭제 확인 모달 등).
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape" || !onClose) return;
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#0b0414]/60 transition-opacity duration-200 starting:opacity-0"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4 bg-surface border border-(--border) outline-none",
          "shadow-[0_24px_48px_-12px_rgb(18_8_31/0.35)]",
          "transition-[opacity,scale] duration-200 starting:opacity-0 starting:scale-[0.96]",
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between">
            <h2 id={titleId} className="text-lg font-bold tracking-[-0.02em] text-text-primary">
              {title}
            </h2>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="-mr-1.5 p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
