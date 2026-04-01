import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
};

const variantClass: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover active:scale-[0.98]",
  secondary:
    "bg-surface-2 text-text-primary border border-[var(--border)] hover:opacity-80 active:scale-[0.98]",
  ghost: "text-text-secondary hover:text-text-primary",
  danger: "bg-danger/10 text-danger hover:bg-danger/20",
};

const sizeClass: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        "font-medium transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {isLoading ? "처리 중..." : children}
    </button>
  );
}
