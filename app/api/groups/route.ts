import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const body = await req.json().catch(() => ({}));
  const name: string | undefined = body?.name?.trim() || undefined;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const invite_code = nanoid(8);

  const { data, error } = await supabase
    .from("groups")
    .insert({ invite_code, name, creator_id: user?.id ?? null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
