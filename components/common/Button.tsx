import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
};

// primary는 캘린더 칸처럼 아래에 두께(lip)가 있는 보드 타일 모양이라, 누르면 그만큼 내려앉는다.
const variantClass: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover shadow-[0_3px_0_color-mix(in_srgb,var(--color-accent)_62%,black)] active:translate-y-[2px] active:shadow-[0_1px_0_color-mix(in_srgb,var(--color-accent)_62%,black)] disabled:shadow-none",
  secondary:
    "bg-surface-2 text-text-primary border border-(--border) hover:bg-[color-mix(in_srgb,var(--color-surface-2),var(--color-text-primary)_6%)] active:scale-[0.97]",
  ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-2 active:scale-[0.97]",
  danger: "bg-danger/10 text-danger hover:bg-danger/20 active:scale-[0.97]",
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
        "font-semibold h-10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
        "transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-150",
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
