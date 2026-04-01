import { createClient } from "@/lib/supabase/server";

export default async function GroupPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("groups").select("*");
  console.log(data, error);
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
