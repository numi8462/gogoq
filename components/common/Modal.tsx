import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export default function Modal({ onClose, title, children, className }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className={cn(
          "w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4 bg-surface border border-(--border)",
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">
              {title}
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary transition p-1 rounded-lg hover:bg-surface-2 cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
