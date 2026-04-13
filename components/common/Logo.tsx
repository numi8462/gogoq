import Image from "next/image";
import Link from "next/link";

type Props = {
  size?: "sm" | "md" | "lg";
};

export default function Logo({ size = "md" }: Props) {
  // const dimension = size === "sm" ? 50 : 200;

  return (
    <Link href="/home" className="flex items-end gap-1" draggable="false">
      <span
        className={`font-bold font-bowlby text-accent ${
          size === "sm" ? "text-2xl" : "text-6xl"
        }`}
      >
        gogoQ
      </span>
      {/* <Image
        src="/logo.png"
        alt="gogoq"
        width={dimension}
        height={dimension}
        loading="eager"
      /> */}
    </Link>
  );
}
