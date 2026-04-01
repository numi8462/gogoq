import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ inviteCode: string }> },
) {
  const { inviteCode } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", inviteCode)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "그룹을 찾을 수 없어요." },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}
