import { useId } from "react";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"input"> & {
  error?: string;
};

export default function Input({ className, error, ...props }: Props) {
  const errorId = useId();

  return (
    <div className="w-full">
      <input
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "w-full border bg-surface text-text-primary",
          "rounded-xl px-3 py-2.5 text-sm outline-none transition-[border-color,box-shadow] duration-150",
          "placeholder:text-text-secondary focus:border-accent focus:ring-3 focus:ring-accent/20",
          "disabled:opacity-60",
          error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-(--border)",
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs text-danger mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}
