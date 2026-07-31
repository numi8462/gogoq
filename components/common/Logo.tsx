import Image from "next/image";
import Link from "next/link";

type Props = {
  size?: "sm" | "md" | "lg";
};

const DIMENSION: Record<NonNullable<Props["size"]>, number> = {
  sm: 32,
  md: 88,
  lg: 128,
};

export default function Logo({ size = "md" }: Props) {
  const dimension = DIMENSION[size];

  // 네브바(sm)는 아이콘만 보여준다.
  if (size === "sm") {
    return (
      <Link href="/home" className="flex items-end gap-1" draggable="false">
        <Image
          src="/icon.png"
          alt="gogoQ"
          width={dimension}
          height={dimension}
          loading="eager"
        />
      </Link>
    );
  }

  // 그 외(홈 히어로 등)는 워드마크의 "Q"만 로고 아이콘으로 대체한다.
  return (
    <Link
      href="/home"
      className="inline-flex items-center font-bold font-bowlby text-accent text-6xl"
      draggable="false"
    >
      gogo
      <Image
        src="/icon.png"
        alt="Q"
        width={dimension}
        height={dimension}
        loading="eager"
        className="inline-block"
      />
    </Link>
  );
}
