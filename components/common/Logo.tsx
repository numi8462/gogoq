import Image from "next/image";

type Props = {
  size?: "sm" | "md";
};

export default function Logo({ size = "md" }: Props) {
  const dimension = size === "sm" ? 24 : 32;

  return (
    <div className="flex items-center gap-1">
      <Image
        src="/logo.png" // public/logo.png
        alt="gogoq"
        width={dimension}
        height={dimension}
      />
      <span
        className={`font-bold text-text-primary ${size === "sm" ? "text-sm" : "text-base"}`}
      >
        gogoQ
      </span>
    </div>
  );
}
