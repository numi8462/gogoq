import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "w-full border border-(--border) text-text-primary",
        "rounded-xl px-3 py-2.5 text-sm outline-none transition-all",
        "placeholder:text-text-secondary focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}
