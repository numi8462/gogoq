import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ inviteCode: string }>;
};

export default async function InvitePage({ params }: Props) {
  const { inviteCode } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", inviteCode)
    .single();

  if (!data) {
    redirect("/");
  }

  redirect(`/group/${data.id}`);
}
