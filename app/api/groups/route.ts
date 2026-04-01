import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();

  const invite_code = nanoid(8);

  const { data, error } = await supabase
    .from("groups")
    .insert({ invite_code })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
