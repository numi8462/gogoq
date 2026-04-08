import Image from "next/image";
import Link from "next/link";

type Props = {
  size?: "sm" | "md" | "lg";
};

export default function Logo({ size = "md" }: Props) {
  const dimension = size === "sm" ? 80 : 300;

  return (
    <Link href="/home" className="flex items-center gap-1">
      <span
        className={`font-bold font-bangers text-accent ${
          size === "sm" ? "text-2xl" : "text-8xl"
        }`}
      >
        gogo
      </span>
      <Image
        src="/logo.png"
        alt="gogoq"
        width={dimension}
        height={dimension}
        loading="eager"
      />
    </Link>
  );
}
