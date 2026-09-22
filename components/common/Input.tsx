import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export default function Input({ className, error, ...props }: Props) {
  return (
    <div className="w-full">
      <input
        className={cn(
          "w-full border text-text-primary",
          "rounded-xl px-3 py-2.5 text-sm outline-none transition-all",
          "placeholder:text-text-secondary focus:border-accent",
          error ? "border-danger focus:border-danger" : "border-(--border)",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
