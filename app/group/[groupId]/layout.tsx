import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ groupId: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { groupId } = await params;
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("title, start_time")
    .eq("group_id", groupId)
    .eq("status", "open")
    .order("start_time", { ascending: true })
    .limit(3);

  const title = "게임 같이 할 사람 모집 중";
  const description = events?.length
    ? `${events.length}개 일정 모집 중 · gogoq에서 참여하세요`
    : "gogoq에서 게임 일정을 잡아보세요";
  const ogImageUrl = `/api/og?groupId=${groupId}&title=${encodeURIComponent(title)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function GroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
